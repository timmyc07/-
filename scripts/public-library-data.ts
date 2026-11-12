import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import { minutes, type Area, type Closure, type Library } from '../lib/study.ts';
import { branchName, clean, parseSlots, roomHours, cityRules, citySite } from './taichung-sources.ts';

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
const nclDirectory = 'https://libstat.ncl.edu.tw/libraryDataDetail/';
const heping = 'https://www.heping.taichung.gov.tw/4086049/post';
const hepingRules = 'https://www.heping.taichung.gov.tw/983338/983564/983630/983636';
const hepingPdf = 'https://www.heping.taichung.gov.tw/media/1324681/臺中市和平區立圖書館閱覽使用須知.pdf';
const hepingDirectory = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000224';
const hepingNcl = nclDirectory + 'L5268000';
const hepingWifi = 'https://da.taichung.gov.tw/media/1183959/111及112年臺中市免費無線上網服務-itaichung-使用情形.pdf';
const hepingReopening = 'https://www.facebook.com/photo/?fbid=1424988006497461';
const holidays2026 = 'https://www.dgpa.gov.tw/information?pid=12685&uid=55';
const fengyuanMap = citySite + 'lib/content/index?Parser=1,117,315';
const fengyuanIntro = citySite + 'lib/Introduction/index?Parser=99,117,314';
const fengyuanB = citySite + 'lib/index?117';
const fengyuanNotice = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1629';
const xinsheNotice = citySite + 'lib/Introduction/index?Parser=99,147,614';
const xinsheGuide = citySite + 'lib/content/index?Parser=1,147,615';
const xinsheClosed = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1483';
const xinsheReopened = citySite + 'latestevent/Details?Parser=22,3,38,27,,,1972';
const xinsheExhibit = citySite + 'lib/active/details?Parser=51,147,613,,,,26332';
const xitunRules = citySite + 'df_ufiles/lib08/臺中市西屯區圖書館討論室使用須知-1050301.pdf';
const dongshiGuide = citySite + 'lib/content/index?Parser=1,149,720';
const dongshiReading = 'https://epaper.tc.edu.tw/application/show-article?id=6222';
const qingshuiGuide = citySite + 'lib/content/index?Parser=1,125,395';
const qingshuiOldHours = 'https://www.taichung.gov.tw/media/270688/512291511171.pdf';
const beitunDirectory = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000228';
const beitunGuide = citySite + 'lib/content/index?Parser=1,113,275';
const beitunNcl = 'https://libstat.ncl.edu.tw/libraryDataDetail/L5247000';
const beitunClosed = 'https://www.taichung.gov.tw/2547762/post';
const beitunReopened = citySite + 'latestevent/Details?Parser=9,3,37,27,,,213';
const nantunDirectory = 'https://libstat.ncl.edu.tw/libraryDataDetail/L5252000';
const nantunIntro = citySite + 'lib/Introduction/index?Parser=99,111,254';
const nantunGuide = citySite + 'lib/content/index?Parser=1,111,255';
const shigangGuide = citySite + 'lib/content/index?Parser=1,145,595';
const shigangIntro = citySite + 'lib/Introduction/index?Parser=99,145,594';
const shigangClosed = 'https://www.taichung.gov.tw/3024659/post';
const shigangReopened = citySite + 'latestevent/Details?Parser=22,3,38,27,,,1916';
const shigangPress = 'https://www.taichung.gov.tw/3398440/post';
const wuriNotice = citySite + 'latestevent/Details?Parser=22,3,38,27,,,1971';
const seatSystem = 'https://spaceme.library.taichung.gov.tw/';
const huludunHours = 'https://www.huludun.taichung.gov.tw/content/index.asp?Parser=1,3,20';
const huludunGuide = citySite + 'lib/content/index?Parser=1,118,325';
const huludunIntro = citySite + 'lib/Introduction/index?Parser=99,118,324';
const wufengIntro = citySite + 'lib/Introduction/index?Parser=99,139,534';
const wufengExhibit = 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=159776';
const wufengEvents = citySite + 'lib/active/index?Parser=51,139,533';
const daanReopened = 'https://www.taichung.gov.tw/3344989/post';
const dadunIntro = citySite + 'lib/Introduction/index?Parser=99,105,194';
const dadunDirectory = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000198';
const dadunCenterHours = 'https://www.dadun.culture.taichung.gov.tw/TCDCCFrontend/SpaceGuide/DadunCenterGuide';

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
  website?: string; studyRoom?: false | null; accessNote?: string; sources?: string[];
  areas?: Area[]; areaUpdates?: Area[]; closures?: Closure[];
}> = {
  大安分館: { studyRoom: false, sources: [nclDirectory + 'L5284000', daanReopened] },
  大肚分館: { studyRoom: false, sources: [nclDirectory + 'L5274000'] },
  大肚瑞井分館: { studyRoom: false, sources: [nclDirectory + 'L4899004'] },
  太平坪林分館: { studyRoom: false, sources: [nclDirectory + 'L5256000'] },
  四張犁分館: { studyRoom: false, sources: [nclDirectory + 'L4899001'] },
  外埔分館: { studyRoom: false, sources: [nclDirectory + 'L5282000'] },
  后里分館: { studyRoom: false, sources: [nclDirectory + 'L5264000'] },
  梧棲分館: { studyRoom: false, sources: [nclDirectory + 'L5278000'] },
  溪西分館: { studyRoom: false, sources: [nclDirectory + 'L4899005'] },
  精武圖書館: { studyRoom: false, sources: [nclDirectory + 'L4899003'] },
  興安分館: { studyRoom: false, sources: [nclDirectory + 'L5011000'] },
  龍井山頂分館: { studyRoom: false, sources: [nclDirectory + 'L5277000'] },
  龍井龍津分館: { studyRoom: false, sources: [nclDirectory + 'L5253000'] },
  豐原分館A棟: { studyRoom: null, sources: [fengyuanMap, fengyuanIntro, fengyuanNotice, 'https://www.facebook.com/FYLIB/'],
    accessNote: 'A 棟於 2026 年 10 月 3 日重新開館。市圖 11 月 6 日更新導覽，3 樓現列嬰幼兒、兒童及漫畫區。分館介紹合列 53 席自習室座位，A 棟是否仍設獨立自習室及其時段、入場資格與設備待確認。',
    closures: [{ from: '2026-02-03', until: '2026-10-02', reason: '整修期間暫停開放', url: fengyuanNotice }],
    areas: [
      { name: '自習室（開放待確認）', kind: 'study', slots: null, access: null,
        equipment: {}, sources: [fengyuanMap, fengyuanIntro] },
      { name: '1 樓客家書區閱覽座位', kind: 'reading',
        slots: parseSlots('週二至週六8:30至21:00、週日8:30至17:30'), access: 'walk-in',
        equipment: { wifi: true }, sources: [fengyuanMap, fengyuanIntro, readingRules, wifiFaq] },
    ] },
  豐原分館B棟: { studyRoom: null, sources: [fengyuanMap, fengyuanB, xinsheNotice, seatSystem],
    accessNote: 'B 棟 1 樓有一般閱覽空間，曾列為新社分館施工時的自修替代地點。市圖空間系統列 2 席公用電腦，須現場登記。B 棟有無獨立自習室仍待確認。',
    areas: [{ name: '1 樓一般閱覽區', kind: 'reading',
      slots: parseSlots('週二至週六8:30至21:00、週日8:30至17:30'), access: 'walk-in',
      equipment: { wifi: true }, sources: [fengyuanB, fengyuanMap, readingRules, wifiFaq] }],
  },
  [limingName]: { website: liming, areas: [{
    name: '4 樓讀者自修室', kind: 'study',
    slots: parseSlots('週二至週六9:00至21:00、週日9:00至17:00'), access: 'walk-in',
    equipment: { wifi: true }, sources: [liming, nlpiWifi],
  }] },
  新社分館: { sources: [xinsheNotice, xinsheGuide, xinsheClosed, xinsheReopened, xinsheExhibit, seatSystem],
    accessNote: '市圖公告原館（興社街四段 1 巷 1 號）於 2026 年 11 月 13 日 11:30 啟用，臨時服務處於 11 月 12 日 17:30 結束。全館常態時間為週二至週日 08:30–17:30。3 樓導覽最後更新於 2025 年 8 月 19 日，整修前館方列自習室 32 席。整修後的自習室是否開放、時段、入場資格及設備待確認。市圖空間系統另列 5 席公用電腦，須現場登記。',
    closures: [
      { from: '2025-08-19', until: '2026-11-12', reason: '原館整修期間暫停開放', url: xinsheClosed },
      { from: '2026-11-13', until: '2026-11-13', time: { start: 0, end: minutes('11:30') },
        reason: '原館於 11:30 啟用', url: xinsheReopened },
    ],
    studyRoom: null,
    areaUpdates: [{ name: '3 樓自習室', kind: 'study', slots: null, access: null, equipment: {},
      sources: [xinsheNotice, xinsheGuide, xinsheReopened] }],
  },
  清水分館: { sources: [qingshuiGuide, qingshuiOldHours],
    accessNote: '館方現行導覽列 4 樓自習室，照片顯示座位有編號和隔板。市府舊刊載有自習室 08:00 開放，現行官網列全館 08:30 開館。自習室是否仍提早開放及固定時段待確認。' },
  大里大新分館: { sources: [citySite + 'lib/content/index?Parser=1,121,355'],
    accessNote: '館方樓層照片顯示 B1 自習室設有隔板，部分座位配置閱讀燈。' },
  西屯分館: { sources: [xitunRules],
    accessNote: '館方的討論室須知明訂討論室不得用於個人自修。獨立自習室時段仍待確認。' },
  北屯分館: { studyRoom: null,
    sources: [beitunDirectory, beitunGuide, beitunNcl, beitunClosed, beitunReopened, seatSystem],
    accessNote: '北屯分館於 2025 年 1 月 17 日整修後重新開館。國資圖名錄的 B1 自習說明屬 2011 年整修後的舊配置。市圖最新空間導覽僅列 1 至 3 樓，館舍介紹未列自習席數。B1 是否對外開放、時段、入場資格與設備待確認。館內另列 4 席公用電腦，須現場登記。',
    closures: [{ from: '2024-02-16', until: '2025-01-16', reason: '整修期間全面閉館', url: beitunClosed }],
    areaUpdates: [{ name: '自習室', kind: 'study', slots: null, access: null, equipment: {},
      sources: [beitunDirectory, beitunGuide, beitunReopened] }],
  },
  南屯分館: { studyRoom: null, sources: [nantunDirectory, nantunIntro, nantunGuide],
    accessNote: '國圖名錄列有自修室，市圖現行樓層導覽列兩層閱覽區，館舍介紹自習室席位空白。獨立自修室目前是否開放、時段、入場資格及設備待確認。市圖另列館內有 Wi-Fi 及筆電席位。',
    areaUpdates: [{ name: '自習室', kind: 'study', slots: null, access: null, equipment: {},
      sources: [nantunDirectory, nantunIntro, nantunGuide] }],
  },
  石岡分館: { sources: [shigangIntro, shigangGuide, shigangClosed, shigangReopened, shigangPress],
    accessNote: '館方於 2026 年 10 月 22 日 11:00 重新開館。分館介紹列自習席 18 席，最新導覽列 3 樓寧靜閱讀區。這 18 席的位置及適用時段待確認。',
    closures: [
      { from: '2025-07-15', until: '2026-10-21', reason: '整修期間暫停閱覽及自習', url: shigangClosed },
      { from: '2026-10-22', until: '2026-10-22', time: { start: 0, end: minutes('11:00') },
        reason: '分館於 11:00 啟用', url: shigangReopened },
    ],
  },
  烏日分館: { sources: [wuriNotice],
    accessNote: '館方公告 2026 年 11 月 14 日 08:30–16:30 配合台電工程停電閉館。若提前復電或取消施工，館方將即時恢復服務。5 樓自習室的平日時段仍待確認。',
    closures: [{ from: '2026-11-14', until: '2026-11-14', time: { start: minutes('08:30'), end: minutes('16:30') },
      reason: '公告 08:30–16:30 停電閉館', url: wuriNotice }],
  },
  葫蘆墩分館: {
    areaUpdates: [{ name: '4 樓自習室', kind: 'study',
      slots: parseSlots('週二至週六08:30至21:00、週日08:30至17:30'), access: 'walk-in', seats: 122,
      equipment: { laptop: true, outlet: false, wifi: true },
      sources: [huludunHours, huludunGuide, huludunIntro, cityRules, laptopFaq, wifiFaq] }],
  },
  霧峰以文分館: { sources: [wufengIntro, wufengExhibit, wufengEvents, daanReopened, seatSystem],
    accessNote: '市府公告原館於 2026 年 9 月 1 日重新開館。館方列出 2 樓自習室 84 席，獨立時段仍待確認。市圖空間系統另列 8 席公用電腦，須現場登記。',
    closures: [{ from: '2025-11-17', until: '2026-08-31', reason: '原館耐震補強期間閉館', url: wufengIntro }],
  },
  上楓分館: { studyRoom: false, sources: [nclDirectory + 'c7a7740d7c404f1f80b7f3e28f7d011b'],
    areaUpdates: [{ name: '館內筆電插座席', kind: 'reading', slots: null, access: null, seats: 20,
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: ['https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000620',
        'https://www.taichung.gov.tw/2095906/post', wifiFaq] }],
  },
  龍井分館: {
    areaUpdates: [{ name: '館內附插座閱覽座位', kind: 'reading', slots: null, access: null, seats: 17,
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: ['https://www.nlpi.edu.tw/FileDownLoad/LibraryPublication/20241118095635201427904.pdf', wifiFaq] }],
  },
  大墩分館: { sources: [dadunCenterHours],
    accessNote: 'B 棟 2 樓自習室週二至週日 08:00–21:00，390 席。另有筆電優先使用區，館方介紹列 24 席，國資圖名錄列 12 席，該區目前席數、獨立時段及插座待確認。',
    areaUpdates: [{ name: 'B 棟 2 樓筆電優先使用區', kind: 'reading', slots: null, access: null,
      equipment: { laptop: true, wifi: true }, sources: [dadunIntro, dadunDirectory, wifiFaq] }],
  },
  溪東分館: {
    areaUpdates: [{ name: '2 樓筆電優先區', kind: 'reading', slots: null, access: null,
      equipment: { laptop: true, wifi: true }, sources: [citySite + 'lib/content/index?Parser=1,148,709', wifiFaq] }],
  },
  沙鹿深波分館: {
    areaUpdates: [{ name: '2 樓筆電優先使用區', kind: 'reading', slots: null, access: null,
      equipment: { laptop: true, wifi: true }, sources: [citySite + 'lib/content/index?Parser=1,126,405', wifiFaq] }],
  },
  東勢許良宇圖書館: { studyRoom: null,
    sources: [dongshiGuide, dongshiReading, xinsheNotice, 'https://www.facebook.com/DongshiHsuLiangYuLibrary', seatSystem],
    accessNote: '全館週二至週六 08:30–21:00、週日 08:30–17:30 開放。新社分館公告曾列為自修替代地點，樓層導覽標示 2 樓自修室，館舍介紹列 0 席。2、3 樓一般閱覽座位有檯燈，市圖空間管理系統另列 6 席公用電腦、須現場登記。2 樓自修室是否對外開放、獨立時段、入場資格及設備待確認。',
    areaUpdates: [{ name: '2 樓自修室（開放待確認）', kind: 'study', slots: null, access: null,
      equipment: {}, sources: [dongshiGuide, citySite + 'lib/Introduction/index?Parser=99,149,719'] }],
  },
  臺中市和平區立圖書館: { website: heping,
    sources: [hepingRules, hepingPdf, hepingReopening, holidays2026],
    accessNote: '2026 年 11 月 1 日恢復開館。一般閱覽週二至週日 08:00–17:00，中午照常開放，週一及國定假日休館。館內提供無線網路，筆電、平板及手機限指定區域充電，禁止自備延長線及轉接插頭。自習室的樓層、獨立時段、入場資格、座位數及座位設備仍待確認。',
    closures: [{ from: '2026-12-25', until: '2026-12-25', reason: '行憲紀念日休館', url: heping }],
    areas: [
      { name: '館內一般閱覽', kind: 'reading', slots: parseSlots('週二至週日8:00至17:00'), access: 'walk-in',
        equipment: { wifi: true }, sources: [heping, hepingPdf, cityFacilities, hepingWifi] },
      { name: '自習室', kind: 'study', slots: null, access: null, equipment: {},
        sources: [hepingDirectory, hepingNcl, cityFacilities] },
    ],
  },
};
