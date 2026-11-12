import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import { clean } from './taichung-sources.ts';

const searchUrl = 'https://libstat.ncl.edu.tw/libraryData/search';
const output = '.local/taichung-directory.json';
export type DirectoryEntry = {
  name: string;
  address: string;
  url: string;
  phone?: string;
  website?: string;
  studyRoom?: boolean;
  status?: string;
};
export type DirectoryEvidence = { checkedAt: string; total: number; entries: DirectoryEntry[]; errors: string[] };

export function parseDirectoryEntry(html: string, url: string, address: string): DirectoryEntry {
  const $ = load(html);
  const list = $('.detailed-text li p');
  const field = (label: string) => list.filter((_, item) => clean($(item).text()).startsWith(label + ':')).first();
  const value = (label: string) => clean(field(label).text()).slice(label.length + 1).trim() || undefined;
  const name = value('中文館名');
  if (!name) throw new Error('國圖館舍頁缺少中文館名');
  const link = field('圖書館網站').find('a').attr('href');
  let website: string | undefined;
  if (link && URL.canParse(link)) {
    const target = new URL(link);
    if (['http:', 'https:'].includes(target.protocol) && !target.username && !target.password) website = target.href;
  }
  const phone = [value('讀者諮詢電話'), value('電話/總機')].find((number) =>
    number && /^(?:\+886[\s-]*|0|\(0)[2-8]/.test(number));
  const study = value('有無自修室');
  return {
    name, address, url,
    phone, website,
    studyRoom: study === '有' ? true : study === '無' ? false : undefined,
    status: value('圖書館狀態'),
  };
}

export function matchesDirectoryText(archive: string, online: string) {
  if (!archive.includes('?')) return archive === online;
  const archived = [...archive];
  const current = [...online];
  return archived.length === current.length && archived.every((character, index) => character === '?' || character === current[index]);
}

export async function readDirectory(): Promise<DirectoryEvidence | null> {
  try {
    return JSON.parse(await readFile(output, 'utf8')) as DirectoryEvidence;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function download(url: string) {
  await delay(320);
  let response = await fetch(url, { signal: AbortSignal.timeout(16000) });
  if (response.status === 429 || response.status === 503) {
    const retry = Number(response.headers.get('Retry-After'));
    await delay(Number.isFinite(retry) && retry > 0 ? Math.min(retry, 60) * 1000 : 3000);
    response = await fetch(url, { signal: AbortSignal.timeout(16000) });
  }
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.text();
}

async function crawl() {
  const initial = load(await download(searchUrl));
  const city = initial('#libCity option').filter((_, option) => initial(option).text().trim() === '臺中市').attr('value');
  if (!city) throw new Error('國圖名錄找不到臺中市篩選');
  const directory = new Map<string, string>();
  let expectedTotal = 0;
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const query = new URLSearchParams({ libCity: city, page: String(page), isPage: 'true' });
    const $ = load(await download(searchUrl + '?' + query));
    if (page === 1) {
      const count = $('.paging').text().match(/總共\s*(\d+)\s*頁\s*[，,]\s*(\d+)\s*筆資料/) ??
        $('body').text().match(/總共\s*(\d+)\s*頁\s*[，,]\s*(\d+)\s*筆資料/);
      if (!count) throw new Error('國圖臺中名錄沒有筆數');
      pages = Number(count[1]);
      expectedTotal = Number(count[2]);
      if (expectedTotal < 400 || pages > 100) throw new Error('國圖臺中名錄筆數異常');
    }
    for (const node of $('a[href^="/libraryDataDetail/"]').toArray()) {
      const url = new URL($(node).attr('href')!, searchUrl).href;
      const address = clean($(node).closest('tr').find('td[data-title="地址"]').text());
      if (address.startsWith('臺中市')) directory.set(url, address);
    }
  }
  if (directory.size < expectedTotal * 0.95) throw new Error('國圖臺中名錄連結數不足：' + directory.size);
  console.log('臺中館舍詳情頁：' + directory.size);
  const previous = await readDirectory();
  const known = new Map(previous?.entries.map((entry) => [entry.url, entry]));
  const entries: DirectoryEntry[] = [];
  const errors: string[] = [];
  for (const [url, address] of directory) {
    try {
      entries.push(parseDirectoryEntry(await download(url), url, address));
    } catch (error) {
      const existing = known.get(url);
      if (existing) entries.push(existing);
      errors.push(url + ' · ' + (error instanceof Error ? error.message : '讀取失敗'));
    }
    if ((entries.length + errors.length) % 50 === 0) console.log('已核對詳情：' + entries.length);
  }
  if (entries.length < directory.size * 0.9) throw new Error('詳情取得比例異常，保留前次來源');
  await mkdir('.local', { recursive: true });
  await writeFile(output + '.tmp', JSON.stringify({ checkedAt: new Date().toISOString(), total: expectedTotal, entries, errors }));
  await rename(output + '.tmp', output);
  console.log('已讀取 ' + entries.length + ' 筆詳情，待重試 ' + errors.length + ' 筆');
}

if (import.meta.main) crawl().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '國圖名錄抓取失敗');
  process.exitCode = 1;
});
