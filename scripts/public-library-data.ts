import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import type { Area, Library } from '../lib/study.ts';
import { branchName, clean, parseSlots, roomHours, citySite } from './taichung-sources.ts';

export const plisDirectory = 'https://data.gov.tw/dataset/99567';
const plisList = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryList?city=City000009';
const plisApi = 'https://plisnet.nlpi.edu.tw/api/API/LibraryInfoData';
export const cityFacilities = citySite + 'libraryinfo/index?Parser=99,3,68,32';
export const laptopFaq = citySite + 'faq/Details?Parser=30,3,49,28,,,97';
export const wifiFaq = citySite + 'faq/Details?Parser=30,3,49,28,,,67';
export const readingRules = citySite + 'form/Details?Parser=2,3,48,28,,,199';

type PublicRow = { Name: string; Address: string; TEL: string; Longitude: string; Latitude: string };
type PublicRegion = { 縣市: string; 圖書館資訊: PublicRow[] };
type PublicDetail = { url: string; study: boolean; schedule: ReturnType<typeof roomHours> };
export type PublicEvidence = {
  url: string;
  row: PublicRow;
  details?: PublicDetail;
};

export function publicLibraryDetail(html: string, url: string): PublicDetail {
  const $ = load(html);
  const hours = $('td[data-th="開放時間"]');
  hours.find('br').replaceWith('\n');
  hours.find('p').append('\n');
  const schedule = roomHours(hours.text());
  const study = $('td[data-th="服務設施"] img').toArray().some((image) =>
    /自[修習]室/.test($(image).attr('alt') ?? ''));
  return { url, study: study || schedule.study.length > 0, schedule };
}

export async function publicEvidence(html: (url: string) => Promise<string>) {
  const rows = JSON.parse(await html(plisApi)) as PublicRegion[];
  const city = rows.find((region) => clean(region['縣市']) === '臺中市')?.['圖書館資訊'];
  if (!city || city.length < 45) throw new Error('公共圖書館開放資料的臺中筆數異常');
  const $ = load(await html(plisList));
  const urls = new Map($('a[href^="/Frontend/LibraryFamily/LibraryDetail?LIID="]').toArray().map((link) => [
    branchName($(link).text()), new URL($(link).attr('href')!, plisList).href,
  ]));
  if (urls.size < 45) throw new Error('公共圖書館官方詳情連結不完整');
  const records = new Map<string, PublicEvidence>();
  const errors: string[] = [];
  for (const row of city) {
    const key = branchName(row.Name);
    const url = urls.get(key);
    const evidence: PublicEvidence = { url: plisDirectory, row };
    if (url) {
      try {
        await delay(350);
        evidence.details = publicLibraryDetail(await html(url), url);
      } catch {
        errors.push(row.Name + '的國資圖公共館詳情讀取失敗');
      }
    }
    records.set(key, evidence);
  }
  return { count: city.length, records, errors };
}

export function municipalFacilities(html: string) {
  const $ = load(html);
  const facilities = new Map<string, string[]>();
  for (const link of $('a.list_link[href*="m1="]').toArray()) {
    const code = $(link).attr('href')?.match(/m1=(\d+)/)?.[1];
    if (!code) continue;
    const images = $(link).closest('li').find('span[data-th*="服務設施"] img').toArray();
    facilities.set(code, images.map((image) => clean($(image).attr('alt') ?? '')).filter(Boolean));
  }
  return facilities;
}

export function addressKey(address: string) {
  return clean(address).replace(/^\d{3,6}\s*/, '').replace(/\s|[()]/g, '').replace(/臺中市/, '').replace(/[-–](?=\d)/g, '之');
}

export function applyPublicEvidence(library: Library, evidence: PublicEvidence | undefined) {
  if (!evidence) return;
  const { row, details } = evidence;
  library.sources.push(evidence.url);
  if (details) library.sources.push(details.url);
  if (!library.phone) library.phone = clean(row.TEL) || undefined;
  if (addressKey(library.address) === addressKey(row.Address)) {
    const latitude = Number(row.Latitude);
    const longitude = Number(row.Longitude);
    if (latitude >= 23 && latitude <= 25 && longitude >= 120 && longitude <= 122) {
      library.coordinates = { latitude, longitude };
    }
  }
}

const liming = 'https://w3.nlpi.edu.tw/LibraryInfo/libraryinfo?PageType=1&id=056cad82-2733-4735-a97d-df52863a3839&pageIndex=1';
const nlpiWifi = 'https://www.nlpi.edu.tw/StaticPage/internet-access';
const nchuStudy = 'https://www.lib.nchu.edu.tw/service.php?Key=13&cID=20';
const nchuAccess = 'https://www.lib.nchu.edu.tw/study.php?Key=9&cID=14';
const nchuSeats = 'https://www.lib.nchu.edu.tw/en/service.php?Key=85&cID=20';
const fcu = 'https://webii.lib.fcu.edu.tw/libnews/post/14631';
const thu = 'https://lis.thu.edu.tw/web/page/page.php?lang=zh_tw&scid=23&sid=39';
const pu = 'https://library.pu.edu.tw/?Lang=zh-tw';
const wanhe = 'https://www.wanhegong.org.tw/html/about/index.aspx?num=22';
const cmu = 'https://lib.cmu.edu.tw/alumni.html';
const asia = 'https://library.asia.edu.tw/p/404-1004-661.php?Lang=zh-tw';
const ciguang = 'https://www.amtbtc.org.tw/%E9%97%9C%E6%96%BC%E6%85%88%E5%85%89/ABOUT';
const heping = 'https://www.heping.taichung.gov.tw/4086049/post';
const hepingRules = 'https://www.heping.taichung.gov.tw/983636/Lpsimplelist';

export const limingName = '國立公共資訊圖書館黎明分館';

export const reviewedSources: Record<string, { website: string; accessNote?: string; sources?: string[]; areas?: Area[] }> = {
  [limingName]: { website: liming, areas: [{
    name: '4 樓讀者自修室', kind: 'study',
    slots: parseSlots('週二至週六9:00至21:00、週日9:00至17:00'), access: 'walk-in',
    equipment: { wifi: true }, sources: [liming, nlpiWifi],
  }] },
  國立中興大學圖書館: { website: nchuStudy, accessNote: '一般閱覽限年滿 18 歲、換證入館的校外人士。地下自習室與興閱坊限校內身分。',
    sources: [nchuAccess], areas: [
      { name: 'B1 自習室 A、B 區', kind: 'study', slots: parseSlots('週一至週五8:00至24:00、週六至週日9:00至24:00'),
        access: 'restricted', seats: 112, equipment: { outlet: true, laptop: true }, sources: [nchuStudy, nchuAccess, nchuSeats] },
      { name: 'B1 自習室 C 區', kind: 'quiet', slots: parseSlots('週一至週五8:00至24:00、週六至週日9:00至24:00'),
        access: 'restricted', seats: 48, equipment: { outlet: true, laptop: false }, sources: [nchuStudy, nchuAccess, nchuSeats] },
    ] },
  逢甲大學圖書館: { website: fcu, accessNote: '校外訪客年滿 18 歲，持附照片證件現場換證，每日 50 名。',
    areas: [{ name: '校外讀者館內閱覽', kind: 'reading', slots: parseSlots('週一至週五9:00至17:00、週六至週日10:00至17:00'),
      access: 'conditional', equipment: {}, sources: [fcu] }] },
  東海大學圖書館: { website: thu, accessNote: '考試週及考前一週暫停校外人士換證。自修室特殊時段請查館方公告。',
    areas: [{ name: '館內閱覽', kind: 'reading', slots: parseSlots('週一至週五8:00至21:30、週六至週日9:00至18:00'),
      access: 'conditional', equipment: {}, sources: [thu] }] },
  中國醫藥大學圖書資訊中心: { website: cmu, accessNote: '館方服務指引列明，持館方核發證件的校外讀者可館內閱覽，自習室不開放。',
    areas: [{ name: '自習室', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [cmu] }] },
  亞洲大學圖書館: { website: asia, accessNote: '校外人士須在櫃台登記，憑附照片的有效證件換證入館。' },
  靜宜大學蓋夏圖書館: { website: pu, accessNote: '依館方公告，2026 年 12 月 28 至 31 日暫停校外人士換證。' },
  財團法人臺中市萬和宮附設圖書館: { website: wanhe, accessNote: '館方公告 3 樓提供民眾閱讀服務。',
    areas: [{ name: '3 樓閱覽區', kind: 'reading', slots: parseSlots('週二至週日9:00至17:00'),
      access: 'walk-in', equipment: {}, sources: [wanhe] }] },
  財團法人臺中市私立慈光圖書館: { website: ciguang,
    areas: [{ name: '館內閱覽', kind: 'reading', slots: parseSlots('週一9:00至21:00、週四至週五9:00至21:00、週二至週三9:00至17:00、週六9:00至17:00、週日9:00至18:30'),
      access: null, equipment: {}, sources: [ciguang] }] },
  臺中市和平區立圖書館: { website: heping, sources: [hepingRules],
    accessNote: '區公所公告 2026 年 11 月 1 日重新開館。' },
};
