import { rename, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import directory from '../public/datasets/library-directory.json' with { type: 'json' };
import type { LibraryDetail } from '../lib/library-details.ts';

const index = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryList';
const destination = new URL('../public/datasets/library-details.json', import.meta.url);

async function html(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(url + ' HTTP ' + response.status);
  return response.text();
}

const $ = load(await html(index));
const urls = new Map($('a[href^="/Frontend/LibraryFamily/LibraryDetail?LIID="]').toArray().map((link) =>
  [$(link).text().trim(), new URL($(link).attr('href')!, index).href]));
const queue = directory.libraries.map(({ id, name }) => {
  const url = urls.get(name);
  if (!url) throw new Error('找不到館舍詳情：' + name);
  return { id, url };
});
const details = new Map<string, LibraryDetail>();
await Promise.all(Array.from({ length: 3 }, async () => {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const { id, url } = item;
    const $ = load(await html(url));
    const address = $('td[data-th="地址"]');
    const hours = $('td[data-th="開放時間"]');
    if (address.length !== 1 || hours.length > 1) throw new Error('館舍詳情格式異常：' + url);
    hours.find('br').replaceWith('\n');
    hours.find('p,li,div').append('\n');
    const facilities = $('td[data-th="服務設施"] img').toArray().map((image) => $(image).attr('alt')?.trim())
      .filter((label): label is string => Boolean(label));
    details.set(id, {
      url, address: address.text().trim(), hours: hours.text().trim() || undefined,
      facilities: facilities.length ? [...new Set(facilities)] : undefined,
    });
    await delay(650);
  }
}));

const libraries = Object.fromEntries(directory.libraries.map(({ id }) => [id, details.get(id)]));
const content = JSON.stringify({ collectedAt: new Date().toISOString(), libraries }, null, 2) + '\n';
const temporary = new URL('library-details.' + process.pid + '.tmp', destination);
await writeFile(temporary, content);
await rename(temporary, destination);
console.log(`已保存 ${details.size} 筆館舍詳情`);
