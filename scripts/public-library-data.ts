import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import { minutes, type Area, type Closure, type Library } from '../lib/study.ts';
import { branchName, clean, parseSlots, roomHours, cityRules, citySite, nlpiRules } from './taichung-sources.ts';

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
const nlpiStudySeats = 'https://data.gov.tw/dataset/99698';
const limingDirectory = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000195';
const nclDirectory = 'https://libstat.ncl.edu.tw/libraryDataDetail/';
const heping = 'https://www.heping.taichung.gov.tw/4086049/post';
const hepingRules = 'https://www.heping.taichung.gov.tw/983338/983564/983630/983636';
const hepingCurrentRules = 'https://www.heping.taichung.gov.tw/3905220/post';
const hepingPdf = 'https://www.heping.taichung.gov.tw/media/1324681/臺中市和平區立圖書館閱覽使用須知.pdf';
const hepingDirectory = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000224';
const hepingNcl = nclDirectory + 'L5268000';
const hepingWifi = 'https://da.taichung.gov.tw/media/1183959/111及112年臺中市免費無線上網服務-itaichung-使用情形.pdf';
const hepingReopening = 'https://www.facebook.com/photo/?fbid=1424988006497461';
const hepingClosed = 'https://school.tc.edu.tw/open-message/064731/get-file/6954b2c7837b7238900668a3';
const hepingExtension = 'https://www.heping.taichung.gov.tw/3933936/post';
const holidays2026 = 'https://www.dgpa.gov.tw/information?pid=12685&uid=55';
const election2026 = 'https://info.cec.gov.tw/vote2026/question/';
const fengyuanMap = citySite + 'lib/content/index?Parser=1,117,315';
const fengyuanIntro = citySite + 'lib/Introduction/index?Parser=99,117,314';
const fengyuanB = citySite + 'lib/index?117';
const fengyuanBFacilities = 'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/525cffbf-7077-49fe-bc0f-f58e201d60d1';
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
const qingshuiClosed = 'https://www.taichung.gov.tw/8868/8872/9962/2831779/';
const qingshuiFacilities = 'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/4e98a291-3c3a-4008-bc67-85c3c0e63a5f';
const cityChronology = citySite + 'table/index?Parser=4,3,69,32';
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
const houliReopened = 'https://www.taichung.gov.tw/2105371/post';
const houliIntro = citySite + 'lib/Introduction/index?Parser=99,138,524';
const greenMuseumPlan = 'https://www.rdec.taichung.gov.tw/media/1251864/673th_1140527_-%E6%96%87%E5%8C%96%E5%B1%80-%E7%B6%A0%E7%BE%8E%E5%9C%96.pdf';
const greenMuseumTeen = citySite + 'lib/tour/Details?Parser=14,101,703,,,,46';
const greenMuseumGuide = citySite + 'lib/tour/index?Parser=14,101,703';
const greenMuseumMap = 'https://tgm-go.com.tw/zh-tw/map';
const likeyongGuide = citySite + 'lib/content/index?Parser=1,112,265';
const xinganGuide = citySite + 'lib/content/index?Parser=1,115,295';
const xinganIntro = citySite + 'lib/Introduction/index?Parser=99,115,294';
const xinganVisit = 'https://www.walkerland.com.tw/article/view/349577';
const daliIntro = citySite + 'lib/Introduction/index?Parser=99,120,344';
const xiquFacilities = 'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/273b7047-42a9-4ea8-8326-02f633ecb621';
const dajiaFacilities = 'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/4337e051-9c3a-4014-97a8-f9403c2d9525';
const wuriFacilities = 'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/63f714bc-8755-4e56-85f6-23a3763a69de';
const shengangFacilities = 'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/de9f1431-df4b-4156-8bcf-63f372ff84a9';
const xitunGuide = citySite + 'lib/content/index?Parser=1,109,235';
const xixiGuide = citySite + 'lib/content/index?Parser=1,110,245';
const shangfengGuide = citySite + 'lib/content/index?Parser=1,137,515';
const longjingGuide = citySite + 'lib/content/index?Parser=1,141,555';
const longjingClosed = 'https://www.culture.taichung.gov.tw/2061063/2098033/2274235';
const longjingReopened = 'https://www.taichung.gov.tw/2734955/post';
const daxinClosure = 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=151616';
const daxinWorks = 'https://assess-public.taichung.gov.tw/ImportantWork/ConstructionDetail/011425697';
const southClosed = 'https://idoor.taichung.gov.tw/info/newsDetail?id=386CB584-D805-4BBE-BD05-14F41773727D';
const southReopened = citySite + 'latestevent/Details?Parser=9,3,37,27,,,189';
const dayaClosed = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1597';
const dayaReopened = citySite + 'latestevent/Details?Parser=22,3,38,27,,,1962';
const tanziClosed = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1598';
const tanziReopened = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1941';
const tanziExhibit = citySite + 'lib/active/details?Parser=51,140,543,,,,22942';
const tanziIntro = citySite + 'lib/Introduction/index?Parser=99,140,544';
const dadunIntro = citySite + 'lib/Introduction/index?Parser=99,105,194';
const dadunGuide = citySite + 'lib/content/index?Parser=1,105,195';
const dadunDirectory = 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000198';
const dadunCenterHours = 'https://www.dadun.culture.taichung.gov.tw/TCDCCFrontend/SpaceGuide/DadunCenterGuide';
const dadunCalendar = 'https://www.dadun.culture.taichung.gov.tw/MessagePublic/MessageDetail?MPID=MP00000665';
const nansongNotice = citySite + 'latestevent/Details?Parser=22,3,38,27,,,1631';
const wenchangReopened = 'https://www.taichung.gov.tw/2968215/post';
const wenchangGuide = citySite + 'lib/content/index?Parser=1,127,415';
const dongshiIntro = citySite + 'lib/Introduction/index?Parser=99,149,719';
const xidongIntro = citySite + 'lib/Introduction/index?Parser=99,148,708';
const xidongGuide = citySite + 'lib/content/index?Parser=1,148,709';
const standardReadingHours = '週二至週六8:30至21:00、週日8:30至17:30';

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
  schedule?: Library['schedule']; reopening?: string;
  readingEquipment?: Area['equipment']; readingLimitedOpening?: Area['limitedOpening'];
}> = {
  大安分館: { studyRoom: false, sources: [nclDirectory + 'L5284000', daanReopened],
    accessNote: '市府公告大安分館完成耐震補強後於 2026 年 8 月 18 日重新開館。一般閱覽的筆電席及指定充電位置待確認。',
  },
  大肚分館: { studyRoom: false, sources: [nclDirectory + 'L5274000'] },
  大肚瑞井分館: { studyRoom: false, sources: [nclDirectory + 'L4899004'] },
  中區分館: {
    sources: [citySite + 'lib/Introduction/index?Parser=99,102,164', citySite + 'lib/content/index?Parser=1,102,165'],
    readingEquipment: { laptop: true },
    accessNote: '中區分館位於區公所 7 樓，館方列有筆電席位。座位插座待確認。',
  },
  東區分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,103,174'],
    readingEquipment: { laptop: true },
    accessNote: '分館介紹列有指定筆電席位。自習室獨立時段及閱覽座位插座待確認。',
  },
  南區分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,106,204', southClosed, southReopened, cityChronology],
    readingEquipment: { laptop: true },
    accessNote: '原館完成耐震補強後於 2025 年 3 月 22 日重新開館。分館介紹列有指定筆電席位。4 樓自習室獨立時段及閱覽座位插座待確認。',
    closures: [{ from: '2024-03-08', until: '2025-03-21', reason: '原館耐震補強期間暫停閱覽及自習服務', url: southClosed }],
  },
  北區分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,107,214'],
    readingEquipment: { laptop: true },
    accessNote: '分館介紹列有指定筆電席位。自習室獨立時段及閱覽座位插座待確認。',
  },
  大雅分館: { sources: [dayaClosed, dayaReopened], reopening: dayaReopened,
    schedule: parseSlots(standardReadingHours),
    accessNote: '館方公告雅潭路四段 800 號原館於 2026 年 12 月 15 日全面恢復服務。原館週二至週六 08:30–21:00、週日 08:30–17:30。永和路 222 號 3 樓臨時服務處於 12 月 13 日閉館，當日起可使用原館還書箱。整修後自習室配置與充電座位待確認。',
    closures: [{ from: '2026-05-26', until: '2026-12-14', reason: '原館整修後於 12 月 15 日重新開館', url: dayaClosed }],
  },
  潭子分館: { sources: [tanziClosed, tanziReopened, tanziExhibit, tanziIntro, seatSystem], reopening: tanziReopened,
    schedule: parseSlots(standardReadingHours),
    readingEquipment: { laptop: true },
    accessNote: '館方公告原館於 2026 年 11 月 3 日起試營運，提供 1 樓閱覽、預約取書及還書箱服務。11 月 17 日全面開放。週二至週六 08:30–21:00、週日 08:30–17:30。館舍介紹列有指定筆電席位，市圖空間系統列 5 台公用電腦、須現場登記。試營運期間設備、指定充電位置及獨立自習室待確認。',
    closures: [{ from: '2026-01-26', until: '2026-11-02', reason: '原館整修後於 11 月 3 日開始試營運', url: tanziReopened }],
    readingLimitedOpening: { from: '2026-11-03', until: '2026-11-16', name: '1 樓閱覽區（試營運）' },
  },
  太平分館: {
    sources: ['https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000226',
      citySite + 'lib/content/index?Parser=1,123,375'],
    readingEquipment: { laptop: true },
    accessNote: '國資圖名錄列有筆電優先座位，館方導覽列 1 樓一般閱覽區及 B1 自習室。筆電席位位置、插座及自習室獨立時段待確認。',
  },
  太平坪林分館: { studyRoom: false,
    sources: [nclDirectory + 'L5256000', citySite + 'lib/Introduction/index?Parser=99,124,384'],
    readingEquipment: { laptop: true },
    accessNote: '分館介紹列 1 樓活力區可使用筆電。各樓層各有 80 個閱覽席，指定充電位置待確認。',
  },
  四張犁分館: { studyRoom: false, sources: [nclDirectory + 'L4899001'] },
  外埔分館: { studyRoom: false, sources: [nclDirectory + 'L5282000'] },
  后里分館: { studyRoom: false, sources: [nclDirectory + 'L5264000', houliReopened, houliIntro],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '分館介紹列有筆電席位。市府公告 2022 年改造後在閱覽桌面增設 22 個插座，請使用館方指定的充電座位。',
  },
  '臺中市立圖書館總館（綠美圖）': { studyRoom: false,
    sources: [greenMuseumPlan, greenMuseumTeen, greenMuseumGuide, greenMuseumGuide + ',,,,,,,,1', greenMuseumMap,
      'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000633'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '市圖館舍名錄與全館樓層導覽列有一般閱覽座位及青少年閱覽靜區，未列獨立自習室。文化局資料說明閱讀桌有配置插座及檯燈，2 樓青少年閱覽區的安靜座位可使用筆電和平板。充電請使用館方指定的座位。',
    areaUpdates: [{ name: '2 樓青少年閱覽靜區', kind: 'quiet',
      slots: parseSlots(standardReadingHours), access: 'walk-in',
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: [greenMuseumTeen, greenMuseumPlan, readingRules, wifiFaq] }],
  },
  李科永紀念圖書分館: {
    sources: [likeyongGuide, 'https://travellens.pixnet.net/blog/posts/939436017933247207', 'https://apoarea.tw/lkylib/'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '分館介紹列有筆電席位。3 樓資訊檢索區旁的閱覽桌設有可供筆電充電的插座。',
  },
  梧棲分館: { studyRoom: false, sources: [nclDirectory + 'L5278000'] },
  溪西分館: { studyRoom: false,
    sources: [nclDirectory + 'L4899005', xixiGuide, 'https://niniandblue.com/blog/post/xixilibrary'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有筆電席位。2 樓部分靠窗閱覽桌有插座，請使用館方指定的充電位置。',
  },
  精武圖書館: { studyRoom: false,
    sources: [nclDirectory + 'L4899003', citySite + 'lib/Introduction/index?Parser=99,108,224',
      'https://apoarea.tw/library2/', 'https://www.cubmaga.com/library/'],
    readingEquipment: { laptop: true },
    accessNote: '館方列有指定筆電席位。現場紀錄顯示筆電區位於 2 樓公用電腦旁，早期照片可見座位插座，現行可充電位置及使用規則待確認。',
  },
  興安分館: { studyRoom: false, sources: [nclDirectory + 'L5011000', xinganGuide, xinganIntro, xinganVisit],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '分館介紹列有筆電席位。現場紀錄顯示 2 樓開架閱覽區的高腳長桌有可供讀者使用的插座。',
  },
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
  豐原分館B棟: { studyRoom: null, sources: [fengyuanMap, fengyuanB, xinsheNotice, seatSystem, fengyuanBFacilities],
    accessNote: 'B 棟 1 樓有一般閱覽空間，曾列為新社分館施工時的自修替代地點。市圖空間系統列 2 席公用電腦，須現場登記。市府 B 棟資料列自修室及筆電專區，市圖現行樓層導覽未標示兩者位置。獨立自習室是否開放及筆電席位置仍待確認。',
    areas: [{ name: '1 樓一般閱覽區', kind: 'reading',
      slots: parseSlots('週二至週六8:30至21:00、週日8:30至17:30'), access: 'walk-in',
      equipment: { wifi: true }, sources: [fengyuanB, fengyuanMap, readingRules, wifiFaq] }],
  },
  豐原南嵩分館: { sources: [nansongNotice],
    accessNote: '原館自 2026 年 2 月 3 日起施工休館，館方預計 2027 年 3 月重新開放。施工期間借閱及預約取書可使用豐原分館 B 棟或葫蘆墩分館。實際開館日及整修後空間配置待確認。',
  },
  [limingName]: { website: liming,
    accessNote: '國資圖閱覽規定限指定充電區臨時充電。4 樓自修室座位不提供充電，筆電使用方式待確認。',
    areas: [{
      name: '4 樓讀者自修室', kind: 'study',
      slots: parseSlots('週二至週六9:00至21:00、週日9:00至17:00'), access: 'walk-in', seats: 84,
      equipment: { wifi: true, outlet: false }, sources: [liming, nlpiWifi, nlpiRules, nlpiStudySeats, limingDirectory],
    }],
  },
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
  清水分館: { sources: [qingshuiGuide, qingshuiOldHours, qingshuiClosed, cityChronology, qingshuiFacilities],
    readingEquipment: { laptop: true },
    accessNote: '館方列 4 樓自習室 100 席，現行照片顯示座位有隔板及編號。市府另列館內筆電專區。分館完成耐震補強後於 2025 年 8 月 12 日重新開館。整修前市府刊物載自習室 08:00 開放，現行官網列全館 08:30 開館。自習室目前是否提早開放及固定時段待確認。',
    closures: [{ from: '2024-12-03', until: '2025-08-11', reason: '耐震補強期間暫停閱覽及自習服務', url: qingshuiClosed }],
  },
  大里大新分館: { sources: [citySite + 'lib/content/index?Parser=1,121,355', daxinClosure, daxinWorks],
    accessNote: '館方樓層照片顯示 B1 自習室設有隔板，部分座位配置閱讀燈。文化局紀錄顯示 2025 年 10 月耐震補強期間閉館。自習室獨立時段待確認。',
    closures: [{ from: '2025-10-01', until: '2025-10-31', reason: '耐震補強期間暫停閱覽及自習服務', url: daxinClosure }],
  },
  大里德芳分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,122,364',
    citySite + 'lib/content/index?Parser=1,122,365'],
    readingEquipment: { laptop: true },
    accessNote: '分館介紹列有指定筆電席位。5 樓自習室獨立時段及閱覽座位插座待確認。',
  },
  沙鹿文昌分館: { sources: [wenchangGuide, wenchangReopened, cityChronology],
    accessNote: '分館完成耐震補強及增設電梯後於 2025 年 4 月 17 日重新開館。3 樓自習室有 100 席，館方照片顯示桌面有隔板。獨立時段待確認。',
  },
  大里分館: {
    sources: [daliIntro, 'https://www.walkerland.com.tw/article/view/211808',
      citySite + 'latestevent/Details?Parser=22,3,38,27,,,1832'],
    readingEquipment: { laptop: true },
    accessNote: '館方現行介紹列有筆電席位。較早的現場紀錄指出 2 樓青少年閱覽桌有插座，2026 年另有閱讀設備升級採購，現行充電座位待確認。',
  },
  西區分館: {
    sources: [xiquFacilities, citySite + 'lib/content/index?Parser=1,104,185'],
    readingEquipment: { laptop: true },
    accessNote: '市府服務 e 櫃檯列有筆電專區，現行插座規則待確認。B1 自習室的獨立時段待確認。',
  },
  西屯分館: { sources: [xitunRules, xitunGuide, citySite + 'lib/Introduction/index?Parser=99,109,234'],
    readingEquipment: { laptop: true },
    accessNote: '館方列有筆電席位，2 樓導覽標示無線上網區。討論室不得用於個人自修。獨立自習室時段仍待確認。' },
  大甲分館: { sources: [dajiaFacilities], readingEquipment: { laptop: true },
    accessNote: '市府列有筆電專區及 3 樓自習室。筆電席位樓層、插座與自習室時段待確認。',
  },
  神岡分館: { sources: [shengangFacilities], readingEquipment: { laptop: true },
    accessNote: '市府列有筆電專區，館方導覽列 3 樓自習室。筆電席位置、插座及自習室獨立時段待確認。',
  },
  北屯分館: { studyRoom: null,
    sources: [beitunDirectory, beitunGuide, beitunNcl, beitunClosed, beitunReopened, seatSystem],
    accessNote: '北屯分館於 2025 年 1 月 17 日整修後重新開館。國資圖名錄的 B1 自習說明屬 2011 年整修後的舊配置。市圖最新空間導覽僅列 1 至 3 樓，館舍介紹未列自習席數。B1 是否對外開放、時段、入場資格與設備待確認。館內另列 4 席公用電腦，須現場登記。',
    closures: [{ from: '2024-02-16', until: '2025-01-16', reason: '整修期間全面閉館', url: beitunClosed }],
    areaUpdates: [{ name: '自習室', kind: 'study', slots: null, access: null, equipment: {},
      sources: [beitunDirectory, beitunGuide, beitunReopened] }],
  },
  南屯分館: { studyRoom: null, sources: [nantunDirectory, nantunIntro, nantunGuide,
    'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000205'],
    readingEquipment: { laptop: true },
    accessNote: '國資圖 2026 年更新的公共圖書館名錄列有自習室。市圖現行樓層導覽列兩層閱覽區，館舍介紹自習室席位空白。獨立自修室是否開放、時段、入場資格與設備待確認。館內另有指定筆電席位，插座位置待確認。',
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
  烏日分館: { sources: [wuriNotice, wuriFacilities],
    readingEquipment: { laptop: true },
    accessNote: '市府列有筆電專區及 5 樓自習室。館方公告 2026 年 11 月 14 日 08:30–16:30 配合台電工程停電閉館。若提前復電或取消施工，館方將即時恢復服務。5 樓自習室的平日時段仍待確認。',
    closures: [{ from: '2026-11-14', until: '2026-11-14', time: { start: minutes('08:30'), end: minutes('16:30') },
      reason: '公告 08:30–16:30 停電閉館', url: wuriNotice }],
  },
  葫蘆墩分館: {
    sources: [huludunIntro, huludunGuide],
    readingEquipment: { laptop: true },
    accessNote: '分館介紹列有指定筆電席位。筆電席位置及插座待確認。',
    areaUpdates: [{ name: '4 樓自習室', kind: 'study',
      slots: parseSlots('週二至週六08:30至21:00、週日08:30至17:30'), access: 'walk-in', seats: 122,
      equipment: { laptop: true, outlet: false, wifi: true },
      sources: [huludunHours, huludunGuide, huludunIntro, cityRules, laptopFaq, wifiFaq] }],
  },
  霧峰以文分館: { sources: [wufengIntro, wufengExhibit, wufengEvents, daanReopened, seatSystem],
    readingEquipment: { laptop: true },
    accessNote: '市府公告原館於 2026 年 9 月 1 日重新開館。館方列出 2 樓自習室 84 席，獨立時段仍待確認。館內另有指定筆電席位，插座位置待確認。市圖空間系統列 8 席公用電腦，須現場登記。',
    closures: [{ from: '2025-11-17', until: '2026-08-31', reason: '原館耐震補強期間閉館', url: wufengIntro }],
  },
  上楓分館: { studyRoom: false, sources: [nclDirectory + 'c7a7740d7c404f1f80b7f3e28f7d011b'],
    accessNote: '館方列有 20 個筆電插座席。現場紀錄顯示 2 樓開架閱覽區設有附插座的閱覽桌，採館方一般閱覽時段。',
    areaUpdates: [{ name: '館內筆電插座席', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in', seats: 20,
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: ['https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000620',
        'https://www.taichung.gov.tw/2095906/post', shangfengGuide,
        'https://www.ptt.cc/bbs/TaichungBun/M.1662060495.A.FD1.html', readingRules, wifiFaq] }],
  },
  龍井分館: {
    sources: [longjingClosed, longjingReopened, nclDirectory + 'L5276000',
      'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000222'],
    accessNote: '原館完成耐震補強後於 2024 年 8 月 25 日重新開館。現行導覽未列獨立自習室，國圖舊名錄曾列有自修室，現況待確認。國資圖刊物確認 17 個附插座座位與書架交錯設置，依分館的一般閱覽時段使用。',
    closures: [{ from: '2023-02-01', until: '2024-08-24', reason: '原館耐震補強期間暫停閱覽及自習服務', url: longjingClosed }],
    areaUpdates: [{ name: '館內附插座閱覽座位', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in', seats: 17,
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: ['https://www-old.nlpi.edu.tw/JournalDetailC003313.aspx?Cond=26ca6952-6617-452f-97e6-36e7bf0bef8b',
        'https://www.tccc.gov.tw/pic/DocSimple/17308827690156%282%29.pdf', longjingGuide, readingRules, wifiFaq] }],
  },
  大墩分館: { sources: [dadunCenterHours, dadunGuide, dadunCalendar, readingRules],
    accessNote: 'B 棟 2 樓自習室週二至週日 08:00–21:00，390 席。同樓筆電優先使用區依閱覽須知的分館一般時段週二至週日 08:30–21:00。席數依分館官網列 24 席。該區入場方式及插座待確認。',
    areaUpdates: [{ name: 'B 棟 2 樓筆電優先使用區', kind: 'reading', slots: parseSlots('週二至週日08:30至21:00'), access: null,
      seats: 24, equipment: { laptop: true, wifi: true }, sources: [dadunIntro, dadunGuide, dadunDirectory, readingRules, wifiFaq] }],
    closures: [{ from: '2026-04-20', until: '2026-04-22', reason: '配合大墩文化中心年度機電保養休館', url: dadunCalendar }],
  },
  溪東分館: { studyRoom: false,
    sources: [xidongIntro, xidongGuide, 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000632'],
    accessNote: '市圖館舍名錄及 1 至 3 樓完整導覽列有一般閱覽、討論室及筆電優先區，未列獨立自習室。2 樓筆電優先區依市圖一般閱覽時段開放，靠窗長桌有插座。',
    areaUpdates: [{ name: '2 樓筆電優先區', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in',
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: [xidongGuide, readingRules, wifiFaq, 'https://flyblog.cc/situng-library/'] }],
  },
  沙鹿深波分館: {
    accessNote: '2 樓筆電優先使用區依市圖一般閱覽時段開放。市府 2023 年重開館時公布有 6 席，現行席數及插座待確認。',
    areaUpdates: [{ name: '2 樓筆電優先使用區', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in',
      equipment: { laptop: true, wifi: true }, sources: [citySite + 'lib/content/index?Parser=1,126,405',
        'https://www.taichung.gov.tw/8868/8872/9962/2367743', readingRules, wifiFaq] }],
  },
  東勢許良宇圖書館: { studyRoom: null,
    sources: [dongshiIntro, dongshiGuide, dongshiReading, xinsheNotice, 'https://www.facebook.com/DongshiHsuLiangYuLibrary', seatSystem],
    readingEquipment: { laptop: true },
    accessNote: '全館週二至週六 08:30–21:00、週日 08:30–17:30 開放。新社分館公告曾列為自修替代地點，樓層導覽標示 2 樓自修室，館舍介紹列 0 席。館方列有指定筆電席位，2、3 樓一般閱覽座位有檯燈。市圖空間管理系統另列 6 席公用電腦、須現場登記。指定充電位置及 2 樓自修室是否開放、獨立時段、入場資格及設備待確認。',
    areaUpdates: [{ name: '2 樓自修室（開放待確認）', kind: 'study', slots: null, access: null,
      equipment: {}, sources: [dongshiGuide, dongshiIntro] }],
  },
  臺中市和平區立圖書館: { website: heping,
    sources: [hepingRules, hepingCurrentRules, hepingPdf, hepingReopening, hepingClosed, hepingExtension, holidays2026, election2026],
    accessNote: '2026 年 11 月 1 日恢復開館。一般閱覽週二至週日 08:00–17:00，中午照常開放，週一及國定假日休館。11 月 28 日投票日的開館情況待館方公告。館內使用自建無線網路，原 iTaichung 熱點已停用。筆電、平板及手機限指定區域充電，禁止自備延長線及轉接插頭。自習室的樓層、獨立時段、入場資格、座位數及座位設備仍待確認。',
    closures: [
      { from: '2025-12-30', until: '2026-06-08', reason: '原館耐震補強期間暫停閱覽及自習服務', url: hepingExtension },
      { from: '2026-12-25', until: '2026-12-25', reason: '行憲紀念日休館', url: heping },
    ],
    areas: [
      { name: '館內一般閱覽', kind: 'reading', slots: parseSlots('週二至週日8:00至17:00'), access: 'walk-in',
        equipment: { wifi: true }, sources: [heping, hepingPdf, cityFacilities, hepingWifi] },
      { name: '自習室', kind: 'study', slots: null, access: null, equipment: {},
        sources: [hepingDirectory, hepingNcl, cityFacilities] },
    ],
  },
};
