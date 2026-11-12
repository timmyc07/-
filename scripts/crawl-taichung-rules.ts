import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { mongoClient, snapshots } from '../lib/mongodb.ts';
import { coverageGaps } from '../lib/study.ts';
import type { Library } from '../lib/study.ts';
import { download, institutionalUrl, robotsAllows } from './crawl-taichung-sites.ts';
import { matchSchoolContact, schoolContacts } from './school-contacts.ts';
import { clean } from './taichung-sources.ts';

const output = '.local/taichung-rule-audit.json';
const operatorHosts = new Set(['site.jah.org.tw', 'www.cathay-cultural.org.tw', 'www.amtbtc.org.tw',
  'www.wanhegong.org.tw', 'www.sltung.com.tw', 'ck.ccgh.com.tw']);
const libraryLink = /^(?:圖書(?:館|室|資訊處|服務)(?:首頁|網站)?|閱讀教育(?:專區)?|閱覽服務|流通服務|空間設備|法令規章|開放時間|服務時間|館規)$/;
const rules = /(?:自[修習](?:閱覽)?[室區]|社區共讀站|校外(?:讀者|人士|民眾)(?!協助|入校協助)|(?:圖書[館室]|閱覽).{0,4}(?:開放|使用|管理|借閱|法規|章則|章程)|入館(?:須知|規則|辦法))/;
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
  const institution = institutionalUrl(value);
  if (institution) return institution;
  if (!URL.canParse(value)) return;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || !operatorHosts.has(url.hostname) ||
      url.username || url.password || url.port) return;
  url.hash = '';
  return url;
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

async function auditLibrary(library: Library, schoolUrl?: string) {
  const queue = [...new Set([...(library.ruleLinks ?? []), library.website, schoolUrl].filter(Boolean))];
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
  const pending = snapshot.libraries.filter((library) => coverageGaps(library).length).sort((a, b) =>
    Number(coverageGaps(a).includes('自修空間使用規則')) - Number(coverageGaps(b).includes('自修空間使用規則')));
  const schools = await schoolContacts(async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('教育部名錄無法讀取');
    return response.text();
  });
  const reviewed: Awaited<ReturnType<typeof auditLibrary>>[] = [];
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let library = pending.pop(); library; library = pending.pop()) {
      const contact = matchSchoolContact(library, schools);
      const website = contact?.website;
      const schoolUrl = website && (/^https?:\/\//.test(website) ? website : 'https://' + website);
      reviewed.push(await auditLibrary(library, schoolUrl || undefined));
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
