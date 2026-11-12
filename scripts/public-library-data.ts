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
const fengyuanMap = citySite + 'lib/content/index?Parser=1,117,315';
const fengyuanB = citySite + 'lib/index?117';
const fengyuanNotice = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1629';
const fengyuanReopened = citySite + 'active/details?Parser=9,3,39,27,,,25595';
const xinsheNotice = citySite + 'lib/Introduction/index?Parser=99,147,614';
const csmu = 'https://lib.csmu.edu.tw/p/16-1027-66794.php';
const csmuHours = 'https://lib.csmu.edu.tw/p/404-1027-66792.php?Lang=zh-tw';
const puHours = 'https://library.pu.edu.tw/p/426-1054-32.php?Lang=zh-tw';
const cyutHours = 'https://pmlis.cyut.edu.tw/time.php?LANG=ZH';
const cyutRules = 'https://www.cyut.edu.tw/~rules/laws/pmlis/rs/rs_file8.pdf';
const nutcHours = 'https://elib.nutc.edu.tw/p/404-1115-120628.php';
const nutcMinsheng = 'https://elib.nutc.edu.tw/var/file/115/1115/img/3508/236358511.pdf';
const ncutRules = 'https://library.ncut.edu.tw/var/file/13/1013/img/190/475948058.pdf';
const ncutFloor = 'https://library.ncut.edu.tw/p/412-1013-808.php?Lang=zh-tw';
const shengang = 'https://sgihs.tc.edu.tw/p/424-1120-855.php';
const shengangRules = 'https://school.tc.edu.tw/open-message/064406/get-file/68abb344deb0bd2b6771a807';
const ktgh = 'https://www.ktgh.com.tw/ktgh/Page/Index/1DCF4C70116723F968DA84D88D1BB7D6';
const mingde = 'https://www.tc.edu.tw/page/b5d76c7c-a97a-43f5-b10a-857828f5baf8?keyword=&page=3&school_attr_id=&school_region_id=';
const zhishan = 'https://school.tc.edu.tw/open-message/193521/get-file/6965ba7af66a82934606e9a4';
const dongfeng = 'https://tfjh.tc.edu.tw/var/file/100/1100/img/428312753.pdf';
const shuntian = 'https://school.tc.edu.tw/open-message/064668/get-file/682e7458e81ddf5967365818.pdf';
const zhonggang = 'https://cgsh.tc.edu.tw/p/405-1070-473181,c20486.php';
const fuke = 'https://school.tc.edu.tw/open-message/193526/view-news/3941';
const tcgs = 'https://itcgs.tcgs.tc.edu.tw/library?cid=2163';

export const limingName = '國立公共資訊圖書館黎明分館';

export const reviewedSources: Record<string, {
  website?: string; phone?: string; address?: string; studyRoom?: boolean | null;
  accessNote?: string; sources?: string[]; areas?: Area[]; checkDates?: string[]; closures?: Closure[];
}> = {
  豐原分館A棟: { sources: [fengyuanMap, fengyuanNotice, fengyuanReopened],
    accessNote: 'A 棟整修後於 2026 年 10 月 3 日重新開館。3 樓自習室的獨立時段仍待確認。',
    closures: [{ from: '2026-02-03', until: '2026-10-02', reason: '整修期間暫停開放', url: fengyuanNotice }],
    areas: [{
      name: '3 樓自習室', kind: 'study', slots: null, access: 'walk-in',
      equipment: { laptop: true, outlet: false }, sources: [fengyuanMap, fengyuanNotice, laptopFaq],
    }] },
  豐原分館B棟: { studyRoom: null, sources: [fengyuanMap, fengyuanB, xinsheNotice],
    accessNote: 'B 棟 1 樓有一般閱覽空間。館方樓層導覽列出自習室位於 A 棟，B 棟有無獨立自習室仍待確認。',
    areas: [{ name: '1 樓一般閱覽區', kind: 'reading',
      slots: parseSlots('週二至週六8:30至21:00、週日8:30至17:30'), access: 'walk-in',
      equipment: {}, sources: [fengyuanB, fengyuanMap, readingRules] }],
  },
  私立洛克威爾藝術實驗教育學校圖書館: { address: '臺中市潭子區聚興路888號',
    sources: ['https://www.rwex.tc.edu.tw/index.html'] },
  臺中市立博屋瑪國小圖書室: { website: 'https://tges.tc.edu.tw/',
    sources: ['https://www.tc.edu.tw/page/d61c396e-63a3-4286-ac38-9874ac4092fe/school-content?id=572'] },
  臺中市私立明德高中附設國小部圖書室: { phone: '(04)22877668',
    website: mingde },
  臺中市私立葳格高級中學附設國小部圖書館: { phone: '(04)23164790', sources: ['https://primary.wagor.tc.edu.tw/'] },
  南普陀佛學院圖書館: { phone: '04-22392816',
    sources: ['https://data.gov.tw/dataset/83784'],
    accessNote: '電話為臺中市宗教名冊所列寺方總機，圖書館專線與官網待確認。' },
  光田綜合醫院圖書室: { website: ktgh, sources: ['https://www.ktgh.com.tw/ktgh/Library/EResource'] },
  臺中市立神岡工業高級中等學校圖書館: { website: shengang,
    accessNote: '日常館內閱覽服務提供校內教職員工與在籍學生。社區民眾可依場地規定申請借用。',
    areas: [{ name: '館內閱覽', kind: 'reading', slots: null, access: 'restricted', equipment: {}, sources: [shengangRules] }] },
  臺中市立至善國民中學圖書館: {
    accessNote: '共讀站供校友、退休教職員工、教育志工與學生家長申請借書證。上班日 09:00–12:00、13:00–17:00，視人力調整。寒暑假另行安排。',
    areas: [{ name: '社區共讀站閱覽區', kind: 'reading', slots: null, access: 'restricted',
      equipment: { wifi: false, outlet: false }, sources: [zhishan] }],
  },
  臺中市立東峰國民中學圖書室: {
    accessNote: '共讀站供校友、退休教職員工、教育志工與學生家長申請借書證。上班日 08:30–11:30、13:30–15:30，視人力調整。寒暑假另行安排。',
    areas: [{ name: '社區共讀站閱覽區', kind: 'reading', slots: null, access: 'restricted',
      equipment: { wifi: false, outlet: false }, sources: [dongfeng] }],
  },
  臺中市立順天國民小學圖書室: {
    accessNote: '社區民眾須申辦順天國小借書證。週一、二、四、五 09:00–12:00、13:00–16:00，週三 09:00–12:00，寒暑假另行公告。',
    areas: [{ name: '社區共讀站', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [shuntian] }],
  },
  臺中市立中港高級中學圖書館: { website: zhonggang,
    accessNote: '到警衛室換證後可使用圖書館 2 樓書庫區。一般平日 08:00–12:00、13:10–17:00，寒暑假與校內重大活動依校方公告。',
    areas: [{ name: '2 樓社區共讀站', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [zhonggang] }],
  },
  臺中市立福科國民中學圖書室: {
    accessNote: '上課日供校內師生及志工家長使用。社區讀者須事先申請閱覽證，並依校方公布的非上課日入站。',
    areas: [{ name: '社區共讀站', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [fuke] }],
  },
  臺中市立臺中女中: { website: tcgs,
    accessNote: '資源大樓 4 樓共讀站在上課上班日供校方志工和支援團體使用，一般校外人士於校慶園遊會或運動會可申請入館。',
    areas: [{ name: '4 樓社區共讀站', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [tcgs] }],
  },
  中山醫學大學圖書資訊處: { website: csmu,
    accessNote: '校外人士須持附照片證件換臨時閱覽證查閱館藏。閱覽室與自習室限校內使用，考試或重要活動可暫停校外換證。',
    areas: [{ name: '校內自習室', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [csmu, csmuHours] }] },
  國立勤益科技大學圖書館: { website: ncutFloor,
    accessNote: '校外人士年滿 12 歲可持有效證件到櫃檯換臨時閱覽證。地下自修區的校外適用資格與時段仍待確認。',
    areas: [{ name: 'B1 自修閱覽室', kind: 'study', slots: null, access: null, equipment: {}, sources: [ncutFloor, ncutRules] }] },
  國立臺中科技大學民生校區圖書分館: { website: nutcHours,
    accessNote: '民生分館僅開放館方列明的校外身分換證，例如校友、跨校選課學生與合作館讀者。學期中平日 08:00–20:00，另有寒暑假及考試週安排。',
    areas: [{ name: '民生分館館內閱覽', kind: 'reading', slots: null, access: 'restricted', equipment: {}, sources: [nutcHours, nutcMinsheng] }] },
  朝陽科技大學波錠紀念圖書館: { website: cyutHours,
    accessNote: '閱覽室供朝陽教職員生憑證使用。這份時段適用 115 學年度第 1 學期，連假另有公告。',
    checkDates: ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-10-09', '2026-10-10',
      '2026-10-25', '2026-10-26', '2026-11-28', '2026-12-25', '2026-12-26', '2027-01-01', '2027-01-02'],
    areas: [{ name: '校內閱覽室', kind: 'reading', slots: parseSlots('週一至週五8:00至23:00、週日8:00至20:00'),
      slotPeriod: { from: '2026-09-14', until: '2027-01-17' }, access: 'restricted', equipment: {},
      sources: [cyutHours, cyutRules] }] },
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
  靜宜大學蓋夏圖書館: { website: pu,
    accessNote: 'B2 自習室學期中平日 07:00–21:00。寒暑假另行公告，校外讀者使用自習室資格待確認。2026 年 12 月 28 至 31 日暫停校外人士換證。',
    areas: [{ name: 'B2 自習室', kind: 'study', slots: null, access: null, equipment: {}, sources: [puHours, pu] }] },
  財團法人臺中市萬和宮附設圖書館: { website: wanhe, accessNote: '館方公告 3 樓提供民眾閱讀服務。',
    areas: [{ name: '3 樓閱覽區', kind: 'reading', slots: parseSlots('週二至週日9:00至17:00'),
      access: 'walk-in', equipment: {}, sources: [wanhe] }] },
  財團法人臺中市私立慈光圖書館: { website: ciguang,
    areas: [{ name: '館內閱覽', kind: 'reading', slots: parseSlots('週一9:00至21:00、週四至週五9:00至21:00、週二至週三9:00至17:00、週六9:00至17:00、週日9:00至18:30'),
      access: null, equipment: {}, sources: [ciguang] }] },
  臺中市和平區立圖書館: { website: heping, sources: [hepingRules],
    accessNote: '區公所公告 2026 年 11 月 1 日重新開館，週二至週日 08:00–17:00，法定國定假日公休。',
    areas: [{ name: '館內一般閱覽', kind: 'reading', slots: parseSlots('週二至週日8:00至17:00'), access: 'walk-in',
      equipment: {}, sources: [heping, hepingRules] }] },
};
