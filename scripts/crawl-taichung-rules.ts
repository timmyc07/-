import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import { mongoClient, snapshots } from '../lib/mongodb.ts';
import { coverageGaps, isPublicLibrary } from '../lib/study.ts';
import type { Library } from '../lib/study.ts';
import { clean } from './taichung-sources.ts';

const output = '.local/taichung-public-rule-audit.json';
const publicHosts = new Set(['www.library.taichung.gov.tw', 'www.heping.taichung.gov.tw',
  'nlpi.edu.tw', 'www.nlpi.edu.tw', 'w3.nlpi.edu.tw', 'plisnet.nlpi.edu.tw', 'edu.law.moe.gov.tw']);
const libraryLink = /^(?:閱覽服務|流通服務|空間設備|法令規章|開放時間|服務時間|館規)$/;
const rules = /(?:自[修習](?:閱覽)?[室區]|(?:圖書[館室]|閱覽).{0,4}(?:開放|使用|管理|借閱|法規|章則|章程)|入館(?:須知|規則|辦法))/;
const details = /開放|入[館校室]|登記|換證|憑證|插座|網路|使用對象|使用規定|服務時間/;
type Link = { url: string; label: string };
type Page = { url: string; status: string; title?: string; evidence?: string[]; links?: Link[] };
export type RuleAudit = { importedAt: string; checkedAt: string; libraries: Awaited<ReturnType<typeof auditLibrary>>[] };

export async function readRuleAudit(): Promise<RuleAudit | undefined> {
  try {
    return JSON.parse(await readFile(output, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

function officialUrl(value: string) {
  if (!URL.canParse(value)) return;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || !publicHosts.has(url.hostname) ||
      url.username || url.password || url.port) return;
  url.hash = '';
  return url;
}

async function download(url: URL) {
  await delay(350);
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5500) });
  if (!response.ok) return response;
  const size = Number(response.headers.get('content-length'));
  if (size > 1_500_000) {
    await response.body?.cancel();
    throw new Error('頁面過大');
  }
  return response;
}

const robotsByOrigin = new Map<string, Promise<string[] | null>>();
async function robotsAllows(url: URL) {
  let pending = robotsByOrigin.get(url.origin);
  if (!pending) {
    pending = (async () => {
      try {
        const response = await download(new URL('/robots.txt', url));
        if (response.status === 404 || response.status === 410) return [];
        if (!response.ok) return null;
        const text = await response.text();
        if (!/User-agent:/i.test(text) && /<html/i.test(text)) return [];
        return [...text.matchAll(/^\s*Disallow:\s*(\S+)/gim)].map((match) => match[1].split('#')[0]);
      } catch {
        return null;
      }
    })();
    robotsByOrigin.set(url.origin, pending);
  }
  const paths = await pending;
  // Nonempty exclusions are respected conservatively, including those scoped to a different agent.
  return paths !== null && !paths.some((path) => {
    const literalPrefix = path.split(/[*$]/)[0];
    return literalPrefix && (url.pathname + url.search).startsWith(literalPrefix);
  });
}

const runningByOrigin = new Map<string, Promise<Page>>();
const requested = new Map<string, Promise<Page>>();

function readPage(url: URL): Promise<Page> {
  const cached = requested.get(url.href);
  if (cached) return cached;
  const pending = (runningByOrigin.get(url.origin) ?? Promise.resolve()).then(async (): Promise<Page> => {
    if (!await robotsAllows(url)) return { url: url.href, status: '網站限制自動查核或無法取得爬取規則' };
    const response = await download(url);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      const target = location && officialUrl(new URL(location, url).href);
      await response.body?.cancel();
      return { url: url.href, status: '重新導向', links: target ? [{ url: target.href, label: '館方重新導向' }] : [] };
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('html')) {
      await response.body?.cancel();
      return { url: url.href, status: response.ok ? '非網頁格式' : 'HTTP ' + response.status };
    }
    const $ = load(await response.text());
    $('script,style').remove();
    const title = clean($('title').first().text());
    const evidence = [...new Set($('h1,h2,h3,p,td,li').toArray().map((element) => clean($(element).text()))
      .filter((value) => value.length > 10 && value.length <= 550 && rules.test(value) && details.test(value)))].slice(0, 8);
    const links = new Map<string, Link>();
    for (const anchor of $('a[href]').toArray()) {
      const label = clean($(anchor).text() || $(anchor).attr('title') || '');
      if (label.length > 120 || !(rules.test(label) || libraryLink.test(label))) continue;
      const href = $(anchor).attr('href')!;
      if (!URL.canParse(href, url)) continue;
      const target = officialUrl(new URL(href, url).href);
      if (!target || target.href === url.href) continue;
      links.set(target.href, { url: target.href, label });
    }
    return { url: url.href, status: '已讀取', title, evidence, links: [...links.values()]
      .sort((a, b) => Number(rules.test(b.label)) - Number(rules.test(a.label))).slice(0, 12) };
  }).catch((): Page => ({ url: url.href, status: '網站無法自動讀取' }));
  requested.set(url.href, pending);
  runningByOrigin.set(url.origin, pending);
  return pending;
}

async function auditLibrary(library: Library) {
  const queue = [...new Set([library.website, ...library.sources, ...library.areas.flatMap((area) => area.sources)].filter(Boolean))];
  const visited = new Set<string>();
  const pages: Page[] = [];
  const documents = new Map<string, Link>();
  for (const href of queue) {
    const url = href && officialUrl(href);
    if (!url || visited.has(url.href)) continue;
    if (pages.length >= 7) break;
    if (url.pathname.toLowerCase().endsWith('.pdf')) {
      documents.set(url.href, { url: url.href, label: '館方規則文件' });
      continue;
    }
    visited.add(url.href);
    const page = await readPage(url);
    const { links = [], ...record } = page;
    pages.push(record);
    for (const link of links) {
      if (/\.pdf\b/i.test(link.url) || /\.pdf$/i.test(link.label)) documents.set(link.url, link);
      else if (!visited.has(link.url)) queue.push(link.url);
    }
  }
  return { id: library.id, name: library.name, pages, documents: [...documents.values()].slice(0, 8) };
}

async function crawl() {
  const client = mongoClient();
  const snapshot = await snapshots(client).findOne({ _id: 'taichung' }).finally(() => client.close());
  if (!snapshot) throw new Error('臺中資料尚未匯入');
  if (!snapshot.libraries.every(isPublicLibrary)) {
    throw new Error('請先匯入公立公共圖書館名錄');
  }
  const pending = snapshot.libraries.filter((library) => coverageGaps(library).length);
  const reviewed: Awaited<ReturnType<typeof auditLibrary>>[] = [];
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let library = pending.pop(); library; library = pending.pop()) {
      reviewed.push(await auditLibrary(library));
    }
  }));
  await mkdir('.local', { recursive: true });
  const audit = { importedAt: snapshot.importedAt, checkedAt: new Date().toISOString(),
    libraries: reviewed.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')) };
  await writeFile(output + '.tmp', JSON.stringify(audit), { mode: 0o600 });
  await rename(output + '.tmp', output);
  console.log(JSON.stringify({ libraries: reviewed.length, sitesRead: reviewed.filter((row) => row.pages.some((page) => page.status === '已讀取')).length,
    candidateRules: reviewed.filter((row) => row.documents.length || row.pages.some((page) => page.evidence?.length)).length }));
}

if (import.meta.main) crawl().catch((error: unknown) => {
  console.error(error instanceof Error ? error.name + '：臺中規則查核失敗' : '臺中規則查核失敗');
  process.exitCode = 1;
});
