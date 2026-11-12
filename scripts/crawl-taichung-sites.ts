import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import { readDirectory } from './crawl-taichung-directory.ts';
import { clean } from './taichung-sources.ts';

const output = '.local/taichung-site-evidence.json';
type WebsiteEvidence = { directoryUrl: string; url?: string; rules: string[]; note: string };

export async function readSiteEvidence(): Promise<WebsiteEvidence[]> {
  try {
    return JSON.parse(await readFile(output, 'utf8')) as WebsiteEvidence[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function institutionalUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return;
    if (!/\.(edu|gov)\.tw$/.test(url.hostname)) return;
    url.protocol = 'https:';
    url.hash = '';
    return url;
  } catch {
    return;
  }
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

async function crawlSite(url: URL, directoryUrl: string): Promise<WebsiteEvidence> {
  const rules: string[] = [];
  for (let redirect = 0; redirect < 4; redirect++) {
    if (!await robotsAllows(url)) return { directoryUrl, url: url.href, rules, note: '網站限制自動查核或無法取得爬取規則' };
    const response = await download(url);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      const next = location && institutionalUrl(new URL(location, url).href);
      if (!next) break;
      url = next;
      continue;
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('html')) {
      await response.body?.cancel();
      break;
    }
    const $ = load(await response.text());
    for (const link of $('a[href]').toArray()) {
      const label = clean($(link).text() || $(link).attr('title') || '');
      if (!/校外人士|入館(?:須知|規則|辦法)|圖書館.{0,5}(?:閱覽|管理|開放).{0,5}(?:規定|辦法|須知|時間)|自[習修](?:室|區).{0,6}(?:時間|規定|須知|要點)/.test(label)) continue;
      let target;
      try {
        target = institutionalUrl(new URL($(link).attr('href')!, url).href);
      } catch {
        continue;
      }
      if (target && !rules.includes(target.href)) rules.push(target.href);
      if (rules.length === 5) break;
    }
    return { directoryUrl, url: url.href, rules, note: rules.length ? '館方有規則入口，請核對適用對象及空間' : '官網首頁未列可辨識的入館或自修規則' };
  }
  return { directoryUrl, url: url.href, rules, note: '國圖所列館方網址目前無法自動讀取' };
}

async function crawl() {
  const directory = await readDirectory();
  if (!directory) throw new Error('請先抓取國圖臺中館舍詳情');
  const groups = new Map<string, { url: URL; directoryUrl: string }[]>();
  for (const entry of directory.entries) {
    const url = entry.website && institutionalUrl(entry.website);
    if (!url) continue;
    const group = groups.get(url.hostname) ?? [];
    group.push({ url, directoryUrl: entry.url });
    groups.set(url.hostname, group);
  }
  const remaining = [...groups.values()];
  const evidence: WebsiteEvidence[] = [];
  const byPage = new Map<string, Promise<WebsiteEvidence>>();
  await Promise.all(Array.from({ length: 10 }, async () => {
    for (let group = remaining.pop(); group; group = remaining.pop()) {
      for (const { url, directoryUrl } of group) {
        let pending = byPage.get(url.href);
        if (!pending) {
          pending = crawlSite(url, directoryUrl).catch(() => ({
            directoryUrl, url: url.href, rules: [], note: '國圖所列館方網址目前無法自動讀取',
          }));
          byPage.set(url.href, pending);
        }
        evidence.push({ ...await pending, directoryUrl });
      }
    }
  }));
  await mkdir('.local', { recursive: true });
  await writeFile(output + '.tmp', JSON.stringify(evidence));
  await rename(output + '.tmp', output);
  console.log('已檢查 ' + evidence.length + ' 筆政府及學校館方網址，其中 ' +
    evidence.filter((entry) => entry.rules.length).length + ' 筆找到規則入口');
}

if (import.meta.main) crawl().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '館方網站抓取失敗');
  process.exitCode = 1;
});
