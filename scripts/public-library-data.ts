import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import type { Area, Closure, Library } from '../lib/study.ts';
import { branchName, clean, parseSlots, roomHours, citySite } from './taichung-sources.ts';

export const plisDirectory = 'https://data.gov.tw/dataset/99567';
const plisList = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryList?city=City000009';
const plisApi = 'https://plisnet.nlpi.edu.tw/api/API/LibraryInfoData';
export const cityFacilities = citySite + 'libraryinfo/index?Parser=99,3,68,32';
export const laptopFaq = citySite + 'faq/Details?Parser=30,3,49,28,,,97';
export const wifiFaq = citySite + 'faq/Details?Parser=30,3,49,28,,,67';
export const readingRules = citySite + 'form/Details?Parser=2,3,48,28,,,199';

type PublicRow = {
  Name: string; Address: string; TEL: string; URL?: string;
  Longitude: string | number; Latitude: string | number;
};
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
    if (clean(row.Name) === '測試圖書館') continue;
    const key = branchName(row.Name);
    if (records.has(key)) throw new Error('公共圖書館開放資料館名重複：' + row.Name);
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
  return { records, errors };
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
const heping = 'https://www.heping.taichung.gov.tw/4086049/post';
const hepingRules = 'https://www.heping.taichung.gov.tw/983338/983564/983630/983636';
const hepingPdf = 'https://www.heping.taichung.gov.tw/media/1324681/臺中市和平區立圖書館閱覽使用須知.pdf';
const hepingDirectory = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000224';
const hepingNcl = 'https://libstat.ncl.edu.tw/libraryDataDetail/L5268000';
const hepingReopening = 'https://www.facebook.com/photo/?fbid=1424988006497461';
const holidays2026 = 'https://www.dgpa.gov.tw/information?pid=12685&uid=55';
const fengyuanMap = citySite + 'lib/content/index?Parser=1,117,315';
const fengyuanB = citySite + 'lib/index?117';
const fengyuanNotice = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1629';
const fengyuanReopened = citySite + 'lib/active/details?Parser=51,117,313,,,,25595';
const xinsheNotice = citySite + 'lib/Introduction/index?Parser=99,147,614';
const xitunRules = citySite + 'df_ufiles/lib08/臺中市西屯區圖書館討論室使用須知-1050301.pdf';

export const limingName = '國立公共資訊圖書館黎明分館';

export const studyLocations: Record<string, readonly [name: string, guide: string]> = {
  '103': ['3 樓自習室', '175'],
  '104': ['B1 自習室', '185'],
  '105': ['B棟2F自習室', '195'],
  '106': ['4 樓自習室', '205'],
  '107': ['B1 自習室', '215'],
  '109': ['3 樓自習室', '235'],
  '118': ['4 樓自習室', '325'],
  '120': ['B1 自習室', '345'],
  '121': ['B1 自習室', '355'],
  '122': ['5 樓自習室', '365'],
  '123': ['B1 自習室', '375'],
  '125': ['4 樓自習室', '395'],
  '127': ['3 樓自習室', '415'],
  '128': ['3 樓自習室', '425'],
  '132': ['5 樓自習室', '465'],
  '133': ['3 樓自習室', '475'],
  '139': ['2 樓自習室', '535'],
  '147': ['3 樓自習室', '615'],
};

export const reviewedSources: Record<string, {
  website?: string; studyRoom?: null; accessNote?: string; sources?: string[];
  areas?: Area[]; closures?: Closure[];
}> = {
  豐原分館A棟: { sources: [fengyuanMap, fengyuanNotice, fengyuanReopened],
    accessNote: 'A 棟整修後於 2026 年 10 月 3 日重新開館。3 樓自習室的獨立時段仍待確認。',
    closures: [{ from: '2026-02-03', until: '2026-10-02', reason: '整修期間暫停開放', url: fengyuanNotice }],
    areas: [{
      name: '3 樓自習室', kind: 'study', slots: null, access: 'walk-in',
      equipment: { laptop: true, outlet: false }, sources: [fengyuanMap, fengyuanNotice, laptopFaq],
    }] },
  豐原分館B棟: { studyRoom: null, sources: [fengyuanMap, fengyuanB],
    accessNote: 'B 棟 1 樓有一般閱覽空間。館方樓層導覽列出自習室位於 A 棟，B 棟有無獨立自習室仍待確認。',
    areas: [{ name: '1 樓一般閱覽區', kind: 'reading',
      slots: parseSlots('週二至週六8:30至21:00、週日8:30至17:30'), access: 'walk-in',
      equipment: {}, sources: [fengyuanB, fengyuanMap, readingRules] }],
  },
  [limingName]: { website: liming, areas: [{
    name: '4 樓讀者自修室', kind: 'study',
    slots: parseSlots('週二至週六9:00至21:00、週日9:00至17:00'), access: 'walk-in',
    equipment: { wifi: true }, sources: [liming, nlpiWifi],
  }] },
  新社分館: { sources: [xinsheNotice],
    accessNote: '原館施工期間，臨時服務處設於興社街四段 1 巷 2 號。服務含辦證、領取預約書、還書及報紙閱覽，館方另列附近可自修的館舍。' },
  西屯分館: { sources: [xitunRules],
    accessNote: '館方的討論室須知明訂討論室不得用於個人自修。獨立自習室時段仍待確認。' },
  東勢許良宇圖書館: { studyRoom: null,
    sources: [citySite + 'lib/content/index?Parser=1,149,720', xinsheNotice],
    accessNote: '市圖空間導覽列出 2 樓自修室，新社分館公告也將本館列為自修替代地點。館舍介紹的自習室座位欄為 0，專用座位是否開放、獨立時段及入場規則仍待確認。' },
  臺中市和平區立圖書館: { website: heping,
    sources: [hepingRules, hepingPdf, hepingReopening, holidays2026],
    accessNote: '2026 年 11 月 1 日恢復開館。一般閱覽週二至週日 08:00–17:00，中午照常開放，週一及國定假日休館。館內提供無線網路，筆電、平板及手機限指定區域充電，禁止自備延長線及轉接插頭。自習室的樓層、獨立時段、入場資格、座位數及座位設備仍待確認。',
    closures: [{ from: '2026-12-25', until: '2026-12-25', reason: '行憲紀念日休館', url: heping }],
    areas: [
      { name: '館內一般閱覽', kind: 'reading', slots: parseSlots('週二至週日8:00至17:00'), access: 'walk-in',
        equipment: {}, sources: [heping, hepingPdf] },
      { name: '自習室', kind: 'study', slots: null, access: null, equipment: {},
        sources: [hepingDirectory, hepingNcl, cityFacilities] },
    ],
  },
};
