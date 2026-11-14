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
const xinshePress = 'https://www.taichung.gov.tw/3413311/post';
const xinsheWorks = 'https://assess-public.taichung.gov.tw/ImportantWork/Detail/114DQ00010';
const xinsheExhibit = citySite + 'lib/active/details?Parser=51,147,613,,,,26332';
const xinsheFloorExhibit = citySite + 'lib/active/details?Parser=51,147,613,,,,26193';
const xinsheChildren = 'https://activity.culture.taichung.gov.tw/activites/index-1.asp?id=145349';
const xitunRules = citySite + 'df_ufiles/lib08/臺中市西屯區圖書館討論室使用須知-1050301.pdf';
const dongshiGuide = citySite + 'lib/content/index?Parser=1,149,720';
const dongshiVisit = 'https://allison1951.pixnet.net/blog/posts/927463895613117381';
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
const seatRules = seatSystem + '#/rules/';
const seatLocations = seatSystem + 'rest/council/common/resourceLocations/';
const huludunHours = 'https://www.huludun.taichung.gov.tw/content/index.asp?Parser=1,3,20';
const huludunGuide = citySite + 'lib/content/index?Parser=1,118,325';
const huludunIntro = citySite + 'lib/Introduction/index?Parser=99,118,324';
const wufengIntro = citySite + 'lib/Introduction/index?Parser=99,139,534';
const wufengExhibit = 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=159776';
const wufengEvents = citySite + 'lib/active/index?Parser=51,139,533';
const daanReopened = 'https://www.taichung.gov.tw/3344989/post';
const daanClosed = citySite + 'df_ufiles/df_pics/Images/附件4-閉館公告_page-0001.jpg';
const shandingIntro = citySite + 'lib/Introduction/index?Parser=99,142,564';
const shandingGuide = citySite + 'lib/content/index?Parser=1,142,565';
const shandingTable = citySite + 'df_ufiles/565/s_s__34316299_0.jpg';
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
const daxinExtendedClosure = 'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SypnA_06US96O89tOaMxDIusv9OkhEiRgciu2Jqdh-_Gx5hizm573T2EQn_ffCL1oHZTDg6urE9mw3xMJh0mY3TIO3iqNsIIZWcsoFtvth_JRbLFnweNIWh48lCbVOhodLTKdZP6chSfNJ=w2227-h2970-k-no';
const daxinWorks = 'https://assess-public.taichung.gov.tw/ImportantWork/ConstructionDetail/011425697';
const daxinFebruary = 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=155422';
const daxinBookmobile = 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=155491';
const daxinApril = 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=139455';
const southClosed = 'https://idoor.taichung.gov.tw/info/newsDetail?id=386CB584-D805-4BBE-BD05-14F41773727D';
const southReopened = citySite + 'latestevent/Details?Parser=9,3,37,27,,,189';
const dayaClosed = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1597';
const dayaReopened = citySite + 'latestevent/Details?Parser=22,3,38,27,,,1962';
const tanziClosed = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1598';
const tanziReopened = citySite + 'latestevent/Details?Parser=9,3,41,27,,,1941';
const tanziExhibit = citySite + 'lib/active/details?Parser=51,140,543,,,,22942';
const tanziIntro = citySite + 'lib/Introduction/index?Parser=99,140,544';
const iTaichungHotspots = 'https://data.gov.tw/dataset/83840';
const iTaiwanHotspots = 'https://itaiwan.gov.tw/ftp/upload/HotspotData/hotspotlist_tw.csv';
const iTaiwanLocations = 'https://data.gov.tw/dataset/5962';
const municipalAddressLocations = 'https://data.gov.tw/dataset/177460';
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
const inventoryClosure = (from: string, until: string, url: string): Closure => ({
  from, until, url, reason: '圖書盤點休館',
});

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

export const verifiedCoordinates: Record<string, [address: string, latitude: number, longitude: number, source: string]> = {
  'tc-110': ['臺中市西屯區福玄路1號', 24.175814, 120.625580, iTaiwanLocations],
  'tc-112': ['臺中市南屯區龍富路五段一號', 24.152045, 120.626405, municipalAddressLocations],
  'tc-117-a': ['臺中市豐原區市政路2號', 24.241688, 120.717513, iTaiwanLocations],
  'tc-117': ['臺中市豐原區育仁路81號', 24.241138, 120.717404,
    'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/525cffbf-7077-49fe-bc0f-f58e201d60d1'],
  'tc-119': ['臺中市豐原區水源路17巷2號', 24.255042, 120.744705, iTaiwanLocations],
  'tc-122': ['臺中市大里區德芳路一段229號四、五樓', 24.108108, 120.686173, municipalAddressLocations],
  'tc-123': ['臺中市太平區太平三街20號', 24.119075, 120.721530, iTaiwanLocations],
  'tc-126': ['臺中市沙鹿區鎮南路二段488號', 24.233416, 120.564099, municipalAddressLocations],
  'tc-127': ['臺中市沙鹿區文昌街12號', 24.236289, 120.562098, municipalAddressLocations],
  'tc-131': ['臺中市梧棲區民生街15之77號', 24.251865, 120.533033, municipalAddressLocations],
  'tc-134': ['臺中市大肚區頂街里大德6街30號', 24.153804, 120.540962, municipalAddressLocations],
  'tc-136': ['臺中市大雅區雅潭路4段800號', 24.221822, 120.650267, municipalAddressLocations],
  'tc-137': ['臺中市大雅區上楓里樹德街255巷5號', 24.236745, 120.666107, iTaiwanLocations],
  'tc-139': ['臺中市霧峰區大同路8號', 24.061478, 120.698982, iTaiwanLocations],
  'tc-140': ['臺中市潭子區潭秀里中山路二段399號', 24.213537, 120.705020, municipalAddressLocations],
  'tc-145': ['臺中市石岡區明德175號', 24.273927, 120.775870, municipalAddressLocations],
  'tc-147': ['臺中市新社區新社里興社街四段1巷1號', 24.240613, 120.809648, iTaiwanLocations],
};

export const reviewedSources: Record<string, {
  website?: string; studyRoom?: false | null; accessNote?: string; sources?: string[];
  areas?: Area[]; areaUpdates?: Area[]; closures?: Closure[];
  schedule?: Library['schedule']; reopening?: string; checkDates?: Library['checkDates'];
  readingEquipment?: Area['equipment']; readingLimitedOpening?: Area['limitedOpening'];
}> = {
  大安分館: { studyRoom: false, sources: [nclDirectory + 'L5284000', daanClosed, daanReopened,
    'https://spaceme.library.taichung.gov.tw/#/rules/2c9dbfe59bd50daa019bd58b809400f1',
    'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd578d15e0099'],
    accessNote: '大安分館原館於 2025 年 11 月 10 日至 2026 年 8 月 17 日因耐震補強暫停一般閱覽，8 月 18 日重新開館。1 樓網路查詢區有 2 席公用電腦，可持借閱證或身分證現場登記，每次 1 小時。一般閱覽的筆電席及指定充電位置待確認。',
    closures: [{ from: '2025-11-10', until: '2026-08-17', reason: '原館耐震補強期間暫停一般閱覽', url: daanClosed }],
  },
  大肚分館: { studyRoom: false, sources: [nclDirectory + 'L5274000', 'https://www.taichung.gov.tw/3229939/post',
    citySite + 'lib/content/index?Parser=1,134,485',
    seatRules + '2c9dbfe59cf2e26f019d050adfa004a5', seatRules + '2c9dbfe59bd50daa019bd58c832600f7'],
    accessNote: '2026 年市府公開照片可辨認 3 樓靠窗的筆電專用區及使用筆電的讀者。指定充電位置待確認。市圖空間系統列 2 樓兒童區及 3 樓閱覽區各有 4 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
    closures: [inventoryClosure('2026-10-26', '2026-10-27', citySite + 'latestevent/Details?Parser=9,3,38,27,,,1934')],
  },
  大肚瑞井分館: { studyRoom: false,
    sources: [nclDirectory + 'L4899004', citySite + 'lib/Introduction/index?Parser=99,135,494',
      'https://maps.app.goo.gl/n39Ge5bFqz6XwbFn6', 'https://maps.app.goo.gl/ucB1Tv55J1fzQUh3A',
      'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9TP4koXFmhLsbJCM_wkVs430BWpSWr410BWJfXCvyn5j321GJ0LqZdbB_MWzX0ge9uFjhNX4TlMW7OVaDsX8naU1PGEjDOKwFH2hAmBVzHyexVGmwfcVsb6YCOasPhJbZRzjq5HTzYLaBKR=s4000',
      seatRules + '2c9dbfe59bd50daa019bd5601981005b'],
    readingEquipment: { laptop: true },
    accessNote: '館方列有指定筆電席位。到館紀錄指出 2 樓有可自備筆電的閱覽座位。2026 年 4 月到館照片可見 2 樓開架閱覽區靠窗長桌旁有插座，讀者充電許可待確認。市圖空間系統列檢索區有 2 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
  },
  中區分館: {
    sources: [citySite + 'lib/Introduction/index?Parser=99,102,164', citySite + 'lib/content/index?Parser=1,102,165',
      'https://maps.app.goo.gl/rmu2FmxdqtcaP8qS7'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '中區分館位於區公所 7 樓，館方列有筆電席位。2026 年秋季的到館紀錄確認筆電使用區有可用插座。',
    closures: [inventoryClosure('2026-09-07', '2026-09-08', citySite + 'latestevent/index?Parser=22,3,38,27')],
  },
  東區分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,103,174',
    citySite + 'lib/content/index?Parser=1,103,175',
    'https://maps.app.goo.gl/bW4APbyHziUDNuo19', 'https://maps.app.goo.gl/jtZWiEvdF2SjKPYP7',
    'https://maps.app.goo.gl/5jbhC7rd3Q4jT3uY7', 'https://maps.app.goo.gl/sUL4tmHbstN1iC64A',
    'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=157254',
    seatRules + '2c9dbfe59bd50daa019bd59265790121', seatLocations + '2c9dbfe59bd50daa019bd57a4b17009a'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '分館介紹列有指定筆電席位。2025 年到館紀錄及照片顯示 1 樓筆電優先區有 7 席可充電，2026 年到館紀錄也確認館內有充電座位。3 樓自習室有讀者直接入座的紀錄。文化局列 2026 年 5 月 3 日 09:30–11:30 於該室辦理親子活動。筆電席現行席數及自習室固定時段待確認。2 樓兒童電腦區有 6 席，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
  },
  南區分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,106,204', southClosed, southReopened, cityChronology,
    citySite + 'lib/content/index?Parser=1,106,205', 'https://www.dcard.tw/f/exam/p/259724379/b/5',
    'https://maps.app.goo.gl/okZXaMjoEEvr811y8', 'https://maps.app.goo.gl/1LohHM7U7FPFtDw66'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '原館完成耐震補強後於 2025 年 3 月 22 日重新開館。館方列有筆電席位，復館後的現場紀錄顯示 B1 開架閱覽區有可供筆電使用的插座，4 樓自習室也有讀者實際使用。4 樓自習室獨立時段待確認。',
    closures: [{ from: '2024-03-08', until: '2025-03-21', reason: '原館耐震補強期間暫停閱覽及自習服務', url: southClosed }],
  },
  北區分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,107,214',
    citySite + 'lib/content/index?Parser=1,107,215', 'https://www.dcard.tw/f/taichung/p/242556746/b/5-2',
    'https://www.dcard.tw/f/taichung/p/255103821/b/7', 'https://maps.app.goo.gl/wScZxPFvw5ySskwSA',
    seatRules + '2c9dbfe59bd50daa019bd587c76b00c5', seatLocations + '2c9dbfe59bd50daa019bd57b120a009d'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有筆電席位及 4 樓青少年閱覽區，讀者現場紀錄指出 4 樓面向大馬路的部分席位可充電。2025 年到館紀錄描述 B1 自習室的入口及現場告示，獨立時段待確認。市圖空間系統列 4 樓讀者檢索區有 7 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
  },
  大雅分館: { sources: [dayaClosed, dayaReopened, citySite + 'lib/content/index?Parser=1,136,505',
    'https://school.tc.edu.tw/open-message/064622/view-news/4735'],
    reopening: dayaReopened,
    schedule: parseSlots(standardReadingHours),
    accessNote: '館方公告雅潭路四段 800 號原館於 2026 年 12 月 15 日全面恢復服務，週二至週六 08:30–21:00、週日 08:30–17:30。永和路 222 號 3 樓臨時服務處週二至週日 08:30–17:30，提供辦證、借還書、預約取書及期刊報紙閱覽，12 月 13 日起停止服務，當日起可用原館還書箱。整修前的樓層導覽列 2 樓開架閱覽區、3 樓多功能活動區，未列獨立自習室。整修後自習室配置與充電座位待確認。',
    closures: [{ from: '2026-05-26', until: '2026-12-14', reason: '原館整修後於 12 月 15 日重新開館', url: dayaClosed }],
  },
  潭子分館: { sources: [tanziClosed, tanziReopened, tanziExhibit, tanziIntro, iTaichungHotspots, iTaiwanHotspots,
    citySite + 'lib/content/index?Parser=1,140,545',
    seatRules + '2c9dbfe59bd50daa019bd59717130145',
    'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd585042a00ba',
    citySite + 'lib/active/details?Parser=51,140,543,,,,25640',
    citySite + 'active/details?Parser=9,3,39,27,,,24483'], reopening: tanziReopened,
    schedule: parseSlots(standardReadingHours),
    readingEquipment: { laptop: true },
    accessNote: '館方公告原館於 2026 年 11 月 3 日起試營運，日常服務包括 1 樓閱覽、預約取書及還書箱，預定 11 月 17 日全面開放。週二至週六 08:30–21:00、週日 08:30–17:30。B1 多功能活動室另有 11 月 3 日至 29 日的展覽及 11 月 11 日免費電影活動。2025 年樓層導覽列 2 樓開架閱覽區、3 樓青少年閱覽區及討論室，未列獨立自習室。館方列有指定筆電席位，政府名錄列原館有 iTaichung 及 iTaiwan 熱點。市圖空間系統列 3 樓 5 席公用電腦，憑借閱證或身分證登記，每次 1 小時，閉館前 30 分鐘停止受理。試營運期間可用設備、指定充電位置及整修後獨立自習室待確認。',
    closures: [{ from: '2026-01-26', until: '2026-11-02', reason: '原館整修後於 11 月 3 日開始試營運', url: tanziReopened }],
    readingLimitedOpening: { from: '2026-11-03', until: '2026-11-16', name: '1 樓閱覽區（試營運）' },
  },
  太平分館: {
    sources: ['https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000226',
      citySite + 'lib/content/index?Parser=1,123,375', 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=139206',
      'https://maps.app.goo.gl/RQnykLXty1gshiBE8', 'https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00007',
      'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=143966',
      citySite + 'lib/active/details?Parser=51,123,373,,,,26654',
      citySite + 'lib/active/details?Parser=51,123,373,,,,26653',
      'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=143967'],
    readingEquipment: { laptop: true },
    accessNote: '館方導覽列 1 樓一般閱覽區及 B1 自習室，分館介紹列 B1 60 席。5 月曾使用 B1 辦展，11 月 7 日活動在 1 樓兒童室，11 月 10 日至 12 月 27 日的展覽公告只列館址和整館時間。市府列防水修繕於 2026 年 10 月 6 日開工、預計 2027 年 2 月 1 日完工。B1 施工期間的使用情況及固定時段待確認。B1 依市圖自習區規則不供充電，一般閱覽區的指定筆電席位置與插座仍待確認。',
  },
  太平坪林分館: { studyRoom: false,
    sources: [nclDirectory + 'L5256000', citySite + 'lib/Introduction/index?Parser=99,124,384',
      'https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00007',
      'https://maps.app.goo.gl/4VpGyeV8XpEsnmHH8', 'https://maps.app.goo.gl/75fdSXrfSrhWJgHc9',
      'https://maps.app.goo.gl/U7AYCib3yQpK29746'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '分館介紹列 1 樓活力區可使用筆電。各樓層各有 80 個閱覽席。2026 年到館紀錄確認館內部分閱覽座位可充電，插座所在樓層待確認。市府列防水修繕於 2026 年 10 月 6 日開工、預計 2027 年 2 月 1 日完工，館方服務異動待確認。',
  },
  四張犁分館: { studyRoom: false,
    sources: [nclDirectory + 'L4899001', citySite + 'lib/Introduction/index?Parser=99,114,284',
      'https://maps.app.goo.gl/W4rbs7MuGoARCbVK9', 'https://maps.app.goo.gl/KGfM9o9uKRhfxtQM7',
      'https://maps.app.goo.gl/hdVs9xWruLE73VBe8', 'https://maps.app.goo.gl/xtehDU56MrLefFtN8'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有指定筆電席位。2026 年秋季到館紀錄確認部分靠窗座位有可用插座，較早的讀者紀錄指出 2 樓部分靠窗及靠牆席位有插座。充電請依館方指定位置使用。',
  },
  外埔分館: { studyRoom: false, sources: [nclDirectory + 'L5282000',
    citySite + 'lib/Introduction/index?Parser=99,144,584', citySite + 'lib/content/index?Parser=1,144,585',
    'https://www.taichung.gov.tw/1833587/post', 'https://apoarea.tw/wpipulibrary/',
    'https://img.apoarea.tw/20210730125757_13.jpg'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有指定筆電席位。擴建後的現場照片顯示 2 樓開架閱覽區部分長桌設有桌面插座，充電請依館方指定位置使用。',
  },
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
  梧棲分館: { studyRoom: false, sources: [nclDirectory + 'L5278000'],
    readingEquipment: { laptop: true },
    accessNote: '館方列有指定筆電席位。2026 年到館紀錄指出 3 樓筆電區座位無法充電，其他閱覽區插座待確認。',
    areaUpdates: [{ name: '3 樓筆電區', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in',
      equipment: { laptop: true, outlet: false, wifi: true },
      sources: [citySite + 'lib/content/index?Parser=1,130,445', readingRules, wifiFaq,
        'https://maps.app.goo.gl/V7GVmJHERGKT8UEu7'] }],
  },
  梧棲親子館: { sources: [citySite + 'lib/content/index?Parser=1,131,455',
    'https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00004',
    seatRules + '2c9dbfe59bd50daa019bd592fdf10127', seatRules + '2c9dbfe59e20ca16019e24f03302042b',
    'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd580538500af',
    'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd57fcd4700ae'],
    accessNote: '市圖空間系統列 1 樓網路資源區有 5 席公用電腦，嬰幼兒視聽區有 2 席視聽電腦。可憑借閱證或身分證登記，每次 1 小時，閉館前 30 分鐘停止受理。一般閱覽區的指定充電位置待確認。市府列空間改造及閱讀設備更新仍在前置作業，預計 2027 年 12 月 1 日完工。服務異動待館方公告。',
  },
  溪西分館: { studyRoom: false,
    sources: [nclDirectory + 'L4899005', xixiGuide, 'https://niniandblue.com/blog/post/xixilibrary'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有筆電席位。2 樓部分靠窗閱覽桌有插座，請使用館方指定的充電位置。',
  },
  精武圖書館: { studyRoom: false,
    sources: [nclDirectory + 'L4899003', citySite + 'lib/Introduction/index?Parser=99,108,224',
      'https://apoarea.tw/library2/', 'https://www.cubmaga.com/library/',
      'https://maps.app.goo.gl/pNAx4ogtd1tkiFgD9', 'https://maps.app.goo.gl/hpoejP78NDHWW4DE6',
      'https://maps.app.goo.gl/SUHiQn8a8tMeDg6o7'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有指定筆電席位。到館紀錄確認 2 樓公用電腦旁的筆電區有可用插座，充電座位有限。',
  },
  興安分館: { studyRoom: false, sources: [nclDirectory + 'L5011000', xinganGuide, xinganIntro, xinganVisit],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '分館介紹列有筆電席位。現場紀錄顯示 2 樓開架閱覽區的高腳長桌有可供讀者使用的插座。',
  },
  龍井山頂分館: { studyRoom: false, sources: [nclDirectory + 'L5277000', shandingIntro, shandingGuide, shandingTable],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有指定筆電席位。2 樓期刊報紙區的閱覽長桌設有桌面插座，充電請依館方指定位置使用。',
  },
  龍井龍津分館: { studyRoom: false,
    sources: [nclDirectory + 'L5253000', citySite + 'lib/Introduction/index?Parser=99,143,574',
      'https://maps.app.goo.gl/Gci2rDL3MA8bMFsB8', seatRules + '2c9dbfe59bd50daa019bd56ae1d3007d',
      'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd56a761d007c'],
    accessNote: '館方曾公開回覆，館內壁面插座因安全考量未開放，另設有無線充電。現行館舍介紹未列指定筆電席，讀者可用的座位插座及筆電規則待確認。市圖空間系統列 3 樓讀者電腦區有 3 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
  },
  豐原分館A棟: { studyRoom: false, sources: [fengyuanMap, fengyuanIntro, fengyuanNotice, 'https://www.facebook.com/FYLIB/',
    citySite + 'lib/active/details?Parser=51,117,313,,,,26234', 'https://maps.app.goo.gl/zknArbt5C6zW6kES9'],
    accessNote: 'A 棟於 2026 年 10 月 3 日重新開館。復館後的到館紀錄指出原 3 樓自習室已改作其他用途。市圖 11 月 6 日更新導覽，3 樓列嬰幼兒、兒童及漫畫區，11 月館方書展亦使用該樓層。讀者仍可使用館內一般閱覽空間。',
    closures: [{ from: '2026-02-03', until: '2026-10-02', reason: '整修期間暫停開放', url: fengyuanNotice }],
    areas: [
      { name: '1 樓客家書區閱覽座位', kind: 'reading',
        slots: parseSlots('週二至週六8:30至21:00、週日8:30至17:30'), access: 'walk-in',
        equipment: { wifi: true }, sources: [fengyuanMap, fengyuanIntro, readingRules, wifiFaq] },
    ] },
  豐原分館B棟: { studyRoom: false, sources: [fengyuanMap, fengyuanB, xinsheNotice, seatSystem, fengyuanBFacilities,
    nclDirectory + 'L5263000', 'https://maps.app.goo.gl/kGa9bpc4u6TE8cKd6'],
    accessNote: 'B 棟 1 樓有一般閱覽空間，曾列為新社分館施工時的自修替代地點。國家圖書館的兩棟合併名錄將舊自習區列在 A 棟。市圖 2026 年 11 月更新的 B 棟各樓層導覽與 7 月到館紀錄均支持 B 棟未設獨立自習室。市府場地頁的設備標籤仍列自修室和筆電專區，筆電席位置與插座待確認。市圖空間系統列 2 席公用電腦，須現場登記。',
    areas: [{ name: '1 樓一般閱覽區', kind: 'reading',
      slots: parseSlots('週二至週六8:30至21:00、週日8:30至17:30'), access: 'walk-in',
      equipment: { wifi: true }, sources: [fengyuanB, fengyuanMap, readingRules, wifiFaq] }],
  },
  豐原南嵩分館: { sources: [nansongNotice, 'https://assess-public.taichung.gov.tw/ImportantWork/Detail/114DQ00014'],
    accessNote: '原館自 2026 年 2 月 3 日起施工休館。市府列三館耐震補強共案預計 2026 年 12 月 1 日完工，館方預計南嵩分館於 2027 年 3 月重新開放。施工期間借閱及預約取書可使用豐原分館 B 棟或葫蘆墩分館。實際開館日及整修後空間配置待確認。',
  },
  [limingName]: { website: liming,
    accessNote: '國資圖閱覽規定限指定充電區臨時充電。4 樓自修室座位不提供充電，筆電使用方式待確認。',
    areas: [{
      name: '4 樓讀者自修室', kind: 'study',
      slots: parseSlots('週二至週六9:00至21:00、週日9:00至17:00'), access: 'walk-in', seats: 84,
      equipment: { wifi: true, outlet: false }, sources: [liming, nlpiWifi, nlpiRules, nlpiStudySeats, limingDirectory],
    }],
  },
  新社分館: { sources: [xinsheNotice, xinsheGuide, xinsheClosed, xinsheReopened, xinshePress, xinsheWorks, xinsheExhibit, xinsheFloorExhibit, xinsheChildren,
    'https://www.facebook.com/XinsheDL/posts/pfbid023hbviX1it4AEdV6UnzMPzjF3pZjjPPKP3uwvzMf54ZEad5aAVN5pkPhAWbzcspmWl',
    'https://data.gov.tw/dataset/83840', 'https://data.gov.tw/dataset/5962', seatRules + '2c9dbfe59bd50daa019bd590d6aa010f',
    seatLocations + '2c9dbfe59bd50daa019bd585c92900bd', seatLocations + '2c9dbfe59bd50daa019bd58608b500be'],
    accessNote: '原館（興社街四段 1 巷 1 號）已於 2026 年 11 月 13 日 11:30 重新開館。全館常態時間為週二至週日 08:30–17:30。市府復館新聞確認有青少年閱讀、開架閱覽空間及自助借還書設備。館方公告 11 月 14 日活動在 3 樓多功能活動室，文化局列 11 月 18 日活動在 1 樓兒童閱覽區。政府開放資料在原館地址列有 iTaichung 及 iTaiwan 熱點。市圖空間系統列 1 樓上網區有 3 席、3 樓青少年區有 2 席公用電腦，持借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。2025 年 8 月 19 日的樓層導覽仍列整修前 3 樓自習室，分館介紹的 32 席為舊資料。整修後原自習室是否開放、時段、入場資格及設備待確認。',
    closures: [
      { from: '2025-08-19', until: '2026-11-12', reason: '原館整修期間暫停開放', url: xinsheClosed },
      { from: '2026-11-13', until: '2026-11-13', time: { start: 0, end: minutes('11:30') },
        reason: '原館於 11:30 啟用', url: xinsheReopened },
    ],
    studyRoom: null,
    areaUpdates: [{ name: '3 樓自習室', kind: 'study', slots: null, access: null, equipment: {},
      sources: [xinsheNotice, xinsheGuide, xinsheReopened, xinshePress] }],
  },
  清水分館: { sources: [qingshuiGuide, qingshuiOldHours, qingshuiClosed, cityChronology, qingshuiFacilities,
    'https://maps.app.goo.gl/u2R7Bj7UXVWkdiuZA', 'https://maps.app.goo.gl/PBJ1v6VizFhY43cJ9',
    'https://maps.app.goo.gl/cPQHSkbtP7R9MB5r7', seatRules + '2c9dbfe59e134757019e20c425a30be3',
    seatRules + '2c9dbfe59bd50daa019bd595acdd0139'],
    readingEquipment: { laptop: true },
    accessNote: '館方列 4 樓自習室 100 席，座位有隔板及編號。分館於 2025 年 8 月 12 日重新開館，復館當月拍攝的門口公告載明自由入座、每人一席，館方可視情況發放號碼牌，座位不供充電。2026 年秋季仍有讀者到館使用。市府列有筆電專區，館方在整修前曾指引讀者使用 2 樓筆電席，復館後位置及插座待確認。整修前市府刊物載自習室 08:00 開放，現行官網列全館 08:30 開館，自習室固定時段待確認。市圖另列兒童、樂齡電腦各 3 席，可憑借閱證或身分證現場登記，每次 1 小時。',
    closures: [{ from: '2024-12-03', until: '2025-08-11', reason: '耐震補強期間暫停閱覽及自習服務', url: qingshuiClosed },
      inventoryClosure('2026-09-21', '2026-09-23', citySite + 'latestevent/Details?Parser=9,3,38,27,,,1897')],
  },
  大里大新分館: { sources: [citySite + 'lib/content/index?Parser=1,121,355', daxinClosure, daxinWorks,
    daxinFebruary, daxinBookmobile, daxinApril, 'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=153726',
    'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000234',
    'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=154566', 'https://maps.app.goo.gl/yLDS13VQPmJzoYkT7',
    'https://maps.app.goo.gl/d73kT4ABtaTPrKfD7', 'https://maps.app.goo.gl/HprEmA5EHt58yCSXA', daxinExtendedClosure,
    'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=156557',
    'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=156556',
    'https://data.gov.tw/dataset/83840', seatRules + '2c9dbfe59bd27da1019bd4dfbb44000e',
    'https://itaiwan.gov.tw/ITaiwanHotspotQuery/ConditionalQuery?KeyWord=大里大新分館&City=臺中市&Type=1'],
    accessNote: '館方樓層照片顯示 B1 自習室設有隔板，部分座位配置閱讀燈。更新版館門公告載明 2025 年 7 月 17 日至 2026 年 3 月 30 日因耐震補強閉館，施工期間安排館旁行動圖書車。文化局紀錄顯示 4 月 1 日起有 1 樓櫃檯及自助借書服務。國資圖 4 月 7 日更新的公共館名錄列有自習室，並列全館週二至週六 08:30–21:00、週日 08:30–17:30。2026 年春季整修後的讀者到館紀錄提到 B1 自習室可使用，確切復開日及固定時段待館方確認。1 樓一般上網區有 5 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時。3 月 31 日全館開放情況待確認。市府 2026 年 6 月熱點資料列原館有 iTaichung，iTaiwan 名錄仍列該熱點暫停。',
    checkDates: ['2026-03-31'],
    closures: [{ from: '2025-07-17', until: '2026-03-30', reason: '耐震補強期間暫停閱覽及自習服務',
      url: daxinExtendedClosure }],
  },
  大里德芳分館: { sources: [citySite + 'lib/Introduction/index?Parser=99,122,364',
    citySite + 'lib/content/index?Parser=1,122,365', wufengIntro, 'https://maps.app.goo.gl/NhFVxcEkegUgA8Yt7',
    'https://maps.app.goo.gl/yqCx1y6JGXwuunbQ6', 'https://maps.app.goo.gl/M9hgWUGhdbv7m9bg9',
    seatRules + '2c9dbfe59bd50daa019bd58d1bf700fd', seatLocations + '2c9dbfe59bd50daa019bd57e232900a8'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方公開回覆，5 樓筆電優先使用區有地面插座，當時列 6 組、共 12 個插孔。手機緊急充電可洽櫃檯。霧峰以文分館整修公告曾列本館為自習替代據點，2026 年春季有讀者使用自習室。5 樓獨立自習室的固定時段待確認。4 樓有 12 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時。',
  },
  沙鹿文昌分館: { sources: [wenchangGuide, wenchangReopened, cityChronology,
    'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=153801', 'https://maps.app.goo.gl/Ecqg2PhBkV17Et3m8',
    citySite + 'lib/active/details?Parser=51,127,413,,,,23183'],
    accessNote: '分館完成耐震補強及增設電梯後於 2025 年 4 月 17 日重新開館。3 樓自習室有 100 席，館方照片顯示桌面有隔板，2025 年 6 月到館照片可見讀者使用。2026 年 1 月的市府活動紀錄列該室為漫畫原稿展場。日常自習時段待確認。館方 11 月 1 日至 29 日推廣平板借用，公告載明憑借閱證可借 14 天、續借一次。',
  },
  大里分館: {
    sources: [daliIntro, 'https://www.walkerland.com.tw/article/view/211808',
      citySite + 'latestevent/Details?Parser=22,3,38,27,,,1832', wufengIntro, 'https://www.keywow.com.tw/projects/y7',
      'https://www.dcard.tw/f/taichung/p/256811485', 'https://maps.app.goo.gl/cXH2amUJkKXK6qmb6',
      'https://maps.app.goo.gl/jttjVEaJJYqLqDsj9', seatRules + '2c9dbfe59e43e938019e4d9ec18a102e',
      seatRules + '2c9dbfe59bae711e019bb5eae3e4011b'],
    readingEquipment: { laptop: true },
    accessNote: '館方列有筆電席位，2026 年夏季到館紀錄指出筆電及平板專用區有 6 席。較早的到館紀錄指出 2 樓有筆電充電座位，2026 年另有閱讀設備升級採購，現行充電位置待確認。2 樓兒童區有 6 席、青少年區有 4 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時。原設計資料列有 B1 自習室的獨立出入口，2024 年讀者貼文提及過去曾從館旁階梯進入。現行入口開放方式及專室時段待確認。',
  },
  西區分館: {
    sources: [xiquFacilities, citySite + 'lib/content/index?Parser=1,104,185',
      'https://www.dcard.tw/f/taichung/p/232869645/b/8', 'https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00003',
      'https://web.pcc.gov.tw/prkms/tender/common/noticeDate/redirectPublic?ds=20261110&fn=BDM-1-71327203.xml',
      'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=154812',
      'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=154682',
      'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=154672',
      citySite + 'lib/active/details?Parser=51,104,183,,,,22249',
      'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=149751', 'https://maps.app.goo.gl/yG9JLrZfy1mmmMyF9'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '市府列有筆電專區，現行樓層照片顯示 3 樓靠窗的無線上網席，現場紀錄指出該區有兩孔插座。館方空間改造工程於 2026 年 11 月 4 日決標，採購公告預估履約期間為 2026 年 12 月 10 日至 2027 年 7 月 7 日，館方服務異動待公告。2026 年 2 至 4 月 B1 自習室曾作公開展場，展覽時段為週二至週六 08:30–21:00、週日 08:30–17:30。夏季有讀者到館使用，8 月 2 日及 29 日亦作館方活動場地。B1 日常自習的獨立時段待確認。',
  },
  西屯分館: { sources: [xitunRules, xitunGuide, citySite + 'lib/Introduction/index?Parser=99,109,234',
    'https://www.pttweb.cc/bbs/TaichungBun/M.1508074669.A.4FC', 'https://www.pttweb.cc/bbs/TaichungBun/M.1583145209.A.C98',
    'https://maps.app.goo.gl/LWP54ceTsY9eN1co9', 'https://maps.app.goo.gl/RrQysGAQHWg8oWfQ6',
    'https://maps.app.goo.gl/tQy3Tqch1A5iAj3y8', seatRules + '2c9dbfe59bd50daa019bd59904380157',
    seatLocations + '2c9dbfe59bd50daa019bd57b7498009e', seatLocations + '2c9dbfe59bd50daa019bd57b9559009f'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有筆電席位，2 樓導覽標示無線上網區。讀者現場紀錄確認樓梯旁的筆電席有可用插座，館員曾勸導每人使用一個。討論室不得用於個人自修。2026 年秋季有讀者使用 3 樓自習室，固定時段待確認。市圖空間系統列 2 樓及 3 樓讀者檢索區分別有 4 席及 7 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。' },
  大甲分館: { sources: [dajiaFacilities, 'https://maps.app.goo.gl/Ck9VTTrksww5DyFg6',
    'https://maps.app.goo.gl/B4yp3f1BSNcrPh3G8', seatRules + '2c9dbfe59bd50daa019bd55102ef0024'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '市府列有筆電專區及 3 樓自習室。到館紀錄與讀者轉述的櫃檯說明都指出 2 樓靠窗的筆電席可使用插座。3 樓自習室固定時段待確認。市圖另列 10 席公用電腦，可憑借閱證或身分證現場登記，每次 1 小時。',
  },
  神岡分館: { sources: [shengangFacilities, 'https://maps.app.goo.gl/zrY2vqCeYoCA2VCN7',
    'https://spaceme.library.taichung.gov.tw/#/rules/2c9dbfe59bd50daa019bd55cda73004d',
    'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd55c7085004c'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '市府列有筆電專區，2026 年到館紀錄確認指定筆電席有可用插座。3 樓讀者檢索區有 7 席公用電腦，可持借閱證或身分證現場登記，每次 1 小時。筆電席樓層及 3 樓自習室的獨立時段待確認。',
  },
  北屯分館: { studyRoom: false,
    sources: [beitunDirectory, beitunGuide, beitunNcl, beitunClosed, beitunReopened, seatSystem,
      'https://activity.culture.taichung.gov.tw/hisdata/index-1.asp?id=110919',
      'https://assess-public.taichung.gov.tw/ImportantWork/Detail/112DQ00003',
      'https://news.st-media.com.tw/news/45418', 'https://maps.app.goo.gl/bRGKK7LUbjvZaHtJ8',
      'https://maps.app.goo.gl/39ET4YD8qLr73ofU8', 'https://maps.app.goo.gl/uTZrbmh4GnFrrbaVA',
      'https://www.taichung.gov.tw/8868/8872/9962/2879088', 'https://www.taichung.gov.tw/media/1194462/北屯圖書館環境2.jpg',
      citySite + 'df_ufiles/275/s_北屯分館-3f青少年閱覽區.jpg', citySite + 'df_ufiles/275/s_北屯分館-2f期刊報紙區.jpg'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '2025 年 1 月 17 日整修後重新開館。館方新版導覽列出 1 至 3 樓，復館後多則到館紀錄指出 B1 自習室已停止對外使用。市府復館照片顯示 3 樓資訊檢索區旁有讀者在閱覽桌使用筆電與桌面插座。2 樓期刊報紙區亦有桌面電源模組，開放充電情況待確認。館內另有 4 席公用電腦，須現場登記。',
    closures: [{ from: '2024-02-16', until: '2025-01-16', reason: '整修期間全面閉館', url: beitunClosed }],
  },
  南屯分館: { sources: [nantunDirectory, nantunIntro, nantunGuide,
    'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000205',
    'https://spaceme.library.taichung.gov.tw/#/rules/2c9dbfe59bae711e019bb595027c00c2',
    'https://maps.app.goo.gl/ehmACzegPz4vakNT8', 'https://maps.app.goo.gl/mn1dDeSiV5aNvbnX7',
    'https://maps.app.goo.gl/RjTNysYNBTQ3vTfC8'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '國資圖 2026 年更新的公共圖書館名錄列有自習室，2026 年初的到館紀錄指出位於 2 樓。市圖現行樓層導覽未標示該室，固定開放時段待確認。依市圖自習區規則，可安靜使用筆電，座位不供充電，館內提供 Wi-Fi。2 樓部分一般閱覽座位另可充電。依到館紀錄，筆電區曾張貼手機充電請洽櫃檯的說明。2 樓資訊檢索區有 3 席公用電腦，可憑借閱證或身分證明登記，每次 1 小時，閉館前 30 分鐘停止受理。',
    areaUpdates: [{ name: '自習室', kind: 'study', slots: null, access: 'walk-in',
      equipment: { laptop: true, outlet: false, wifi: true },
      sources: [nantunDirectory, nantunIntro, nantunGuide, cityRules, laptopFaq, wifiFaq,
        'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25wd2RqRnJSakJKVlZwT01YSldWbU0wY0dabVYzYxAB!2m1!1s0x0:0x703ee1e9da6f0401!3m1!1s2@1:CAIQACodChtycF9oOnpwdjFrRjBJVVpOMXJWVmM0cGZmV3c%7C%7C'] }],
  },
  石岡分館: { sources: [shigangIntro, shigangGuide, shigangClosed, shigangReopened, shigangPress,
    iTaichungHotspots, iTaiwanHotspots,
    'https://spaceme.library.taichung.gov.tw/#/rules/2c9dbfe59bd50daa019bd56efde60088',
    'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd56e98c30087'],
    accessNote: '館方於 2026 年 10 月 22 日 11:00 重新開館。3 樓寧靜閱讀區設有沙發座位，分館介紹所列 18 席自習座位的位置及適用時段待確認。政府名錄列原館有 iTaichung 及 iTaiwan 熱點。館方空間系統列 3 樓有 3 席公用電腦，可持借閱證或身分證至櫃台登記，每次 1 小時，閉館前 30 分鐘停止受理。',
    closures: [
      { from: '2025-07-15', until: '2026-10-21', reason: '整修期間暫停閱覽及自習', url: shigangClosed },
      { from: '2026-10-22', until: '2026-10-22', time: { start: 0, end: minutes('11:00') },
        reason: '分館於 11:00 啟用', url: shigangReopened },
    ],
  },
  烏日分館: { sources: [wuriNotice, wuriFacilities, 'https://maps.app.goo.gl/6VNs1MjnvsnzE8Cj7',
    seatRules + '2c9dbfe59e5e0612019e6239a29702c9', seatRules + '2c9dbfe59bd50daa019bd59787b2014b'],
    readingEquipment: { laptop: true },
    accessNote: '市府列有筆電專區及 5 樓自習室。2026 年夏季到館紀錄確認假日開館時可到 5 樓自習，固定開放時段仍待確認。市圖另列 1 樓與 4 樓共 4 席公用電腦，以及 3 席兒童電腦，可憑借閱證或身分證現場登記，每次 1 小時。館方公告 2026 年 11 月 14 日 08:30–16:30 配合台電工程停電閉館。若提前復電或取消施工，館方將即時恢復服務。',
    closures: [{ from: '2026-11-14', until: '2026-11-14', time: { start: minutes('08:30'), end: minutes('16:30') },
      reason: '公告 08:30–16:30 停電閉館', url: wuriNotice }],
  },
  葫蘆墩分館: {
    sources: [huludunIntro, huludunGuide, citySite + 'df_ufiles/325/IMG_8125.JPG',
      'https://www.youtube.com/watch?v=v6y2n6iCc98&t=1s', seatRules + '2c9dbfe59bd50daa019bd59873720151'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '分館介紹列有指定筆電席位。館方導覽照片和 2025 年現場報導均可辨認 B1 多元文化圖書區綠柱旁高腳閱覽席的電源插座。充電請依館方指定位置，筆電席的確切位置待確認。市圖空間系統另列 6 席公用電腦，其中一般座椅 4 席、高腳椅 2 席，憑借閱證或身分證現場登記，每次 1 小時。',
    areaUpdates: [{ name: '4 樓自習室', kind: 'study',
      slots: parseSlots('週二至週六08:30至21:00、週日08:30至17:30'), access: 'walk-in', seats: 122,
      equipment: { laptop: true, outlet: false, wifi: true },
      sources: [huludunHours, huludunGuide, huludunIntro, cityRules, laptopFaq, wifiFaq] }],
  },
  霧峰以文分館: { sources: [wufengIntro, wufengExhibit, wufengEvents, daanReopened, seatSystem],
    readingEquipment: { laptop: true },
    accessNote: '市府公告原館於 2026 年 9 月 1 日重新開館。館方列出 2 樓自習室 84 席，獨立時段仍待確認。館內另有指定筆電席位，插座位置待確認。市圖空間系統列 8 席公用電腦，須現場登記。',
    closures: [{ from: '2025-11-17', until: '2026-08-31', reason: '原館耐震補強期間閉館', url: wufengIntro },
      inventoryClosure('2026-10-19', '2026-10-20', citySite + 'latestevent/Details?Parser=22,3,38,27,,,1923')],
  },
  上楓分館: { studyRoom: false, sources: [nclDirectory + 'c7a7740d7c404f1f80b7f3e28f7d011b',
    'https://www.taichung.gov.tw/2095906/post', shangfengGuide, 'https://apoarea.tw/shangfenglibrary/'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '館方列有 20 個筆電插座席。2 樓開架閱覽區部分靠牆及靠窗的閱覽桌附插座，採館方一般閱覽時段，充電請使用館方指定位置。',
    areaUpdates: [{ name: '館內筆電插座席', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in', seats: 20,
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: ['https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000620',
        'https://www.taichung.gov.tw/2095906/post', shangfengGuide,
        'https://www.ptt.cc/bbs/TaichungBun/M.1662060495.A.FD1.html', readingRules, wifiFaq] }],
  },
  龍井分館: { studyRoom: false,
    sources: [longjingClosed, longjingReopened, nclDirectory + 'L5276000', 'https://www.culture.taichung.gov.tw/2735469/post',
      'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000222',
      'https://www.taichung.gov.tw/media/267771/661416535671.pdf',
      'https://www.nlpi.edu.tw/FileDownLoad/LibraryPublication/20241118095635201427904.pdf',
      'https://spaceme.library.taichung.gov.tw/#/rules/2c9dbfe59bd50daa019bd59b28da0169',
      'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59bd50daa019bd5853e3600bb',
      citySite + 'lib/active/details?Parser=51,141,553,,,,26452'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '原館完成耐震補強及空間改造後於 2024 年 8 月 25 日重新開館。區公所舊刊及尚列館舍暫停服務的國家圖書館名錄記載舊自習室。依市圖現行導覽及國資圖復館訪查，3 樓已配置青少年閱覽室、多功能活動室等空間，現行配置無獨立自習室。館內有 17 席附插座的閱覽座位。3 樓資訊檢索區有 4 席公用電腦，可持借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
    closures: [{ from: '2023-02-01', until: '2024-08-24', reason: '原館耐震補強期間暫停閱覽及自習服務', url: longjingClosed }],
    areaUpdates: [{ name: '館內附插座閱覽座位', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in', seats: 17,
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: ['https://www-old.nlpi.edu.tw/JournalDetailC003313.aspx?Cond=26ca6952-6617-452f-97e6-36e7bf0bef8b',
        'https://www.tccc.gov.tw/pic/DocSimple/17308827690156%282%29.pdf', longjingGuide, readingRules, wifiFaq] }],
  },
  大墩分館: { sources: [dadunCenterHours, dadunGuide, dadunCalendar, readingRules,
    'https://spaceme.library.taichung.gov.tw/#/rules/2c9dbfe59bd50daa019bd58b14d900eb'],
    readingEquipment: { outlet: false },
    accessNote: 'B 棟 2 樓自習室週二至週日 08:00–21:00，390 席。同樓筆電優先使用區依閱覽須知的分館一般時段週二至週日 08:30–21:00，館方列 24 席。文化中心規定適用於大墩分館，一般閱覽座位禁止自行接用插座。市圖空間管理系統列 7 席公用電腦，須現場登記。筆電優先區的入場方式及專用充電設備待確認。',
    areaUpdates: [{ name: 'B 棟 2 樓筆電優先使用區', kind: 'reading', slots: parseSlots('週二至週日08:30至21:00'), access: null,
      seats: 24, equipment: { laptop: true, wifi: true }, sources: [dadunIntro, dadunGuide, dadunDirectory, readingRules, wifiFaq] }],
    closures: [{ from: '2026-04-20', until: '2026-04-22', reason: '配合大墩文化中心年度機電保養休館', url: dadunCalendar }],
  },
  溪東分館: { studyRoom: false,
    sources: [xidongIntro, xidongGuide, 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000632',
      'https://maps.app.goo.gl/3iG8SHhW1AU9kSbAA', 'https://maps.app.goo.gl/WksXgMdvxNoG7VKW7',
      citySite + 'df_ufiles/709/s_2f-開架.jpg', seatRules + '2c9dbfe59a9a4fa4019ac38c048b00f3',
      'https://spaceme.library.taichung.gov.tw/rest/council/common/resourceLocations/2c9dbfe59a9a4fa4019ac376219100dc'],
    accessNote: '市圖館舍名錄及樓層導覽未列常設自習室。到館紀錄指出 3 樓多功能室在 2026 年 7 月 4 日已於暑期臨時開放自習，活動優先，當時插座有封塞。臨時自習的起訖及時段待確認。2 樓筆電優先區依一般閱覽時段開放，靠窗長桌有插座。2 樓另有 4 個獨立隔板閱讀席，讀者指出座位前設有插座，充電規則待確認。市圖空間系統列 3 樓有 6 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
    areaUpdates: [{ name: '2 樓筆電優先區', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in',
      equipment: { laptop: true, outlet: true, wifi: true },
      sources: [xidongGuide, readingRules, wifiFaq, 'https://flyblog.cc/situng-library/'] }],
  },
  沙鹿深波分館: {
    sources: ['https://maps.app.goo.gl/5GUBetF3xZVUADHQ6', 'https://maps.app.goo.gl/T12SnJa37vy71kjD8',
      seatRules + '2c9dbfe59bd50daa019bd5951ae30133', seatRules + '2c9dbfe59e635250019e6365ce520072',
      seatLocations + '2c9dbfe59bd50daa019bd57ed9d200ab', seatLocations + '2c9dbfe59bd50daa019bd57f0a3700ac'],
    readingEquipment: { outlet: true },
    closures: [inventoryClosure('2026-09-14', '2026-09-16', citySite + 'latestevent/Details?Parser=22,3,38,27,,,1885')],
    accessNote: '2 樓筆電優先使用區依市圖一般閱覽時段開放。市府 2023 年重開館時公布有 6 席，現行席數待確認。2026 年到館紀錄確認 2 樓部分靠窗席及 1 樓部分閱覽桌有插座。市圖空間系統列 1 樓兒童室有 4 席、2 樓文學區有 3 席公用電腦，憑借閱證或身分證現場登記，每次 1 小時，閉館前 30 分鐘停止受理。',
    areaUpdates: [{ name: '2 樓筆電優先使用區', kind: 'reading', slots: parseSlots(standardReadingHours), access: 'walk-in',
      equipment: { laptop: true, outlet: true, wifi: true }, sources: [citySite + 'lib/content/index?Parser=1,126,405',
        'https://www.taichung.gov.tw/8868/8872/9962/2367743', readingRules, wifiFaq,
        'https://maps.app.goo.gl/5GUBetF3xZVUADHQ6', 'https://maps.app.goo.gl/YP7UqfutW1Pc9hxR9'] }],
  },
  東勢許良宇圖書館: { studyRoom: null,
    sources: [dongshiIntro, dongshiGuide, citySite + 'df_ufiles/720/s_2f-2.jpg',
      citySite + 'df_ufiles/720/s_3f-2.jpg', dongshiVisit, dongshiReading, xinsheNotice,
      'https://www.facebook.com/DongshiHsuLiangYuLibrary', seatSystem, 'https://maps.app.goo.gl/dKPXs6izqCw4xPP49',
      'https://maps.app.goo.gl/cSdFNjxjBhL3d9ZD7', 'https://maps.app.goo.gl/TaF9VJokx8w8TieC6',
      'https://www.facebook.com/photo/?fbid=1575086801313418&set=pcb.1574961614659270',
      citySite + 'lib/active/details?Parser=51,149,718,,,,25917',
      'https://www.huludun.taichung.gov.tw/active/index-1.asp?Parser=99,8,40,,,,160085',
      'https://activity.culture.taichung.gov.tw/activites/index-1.asp?id=144704',
      'https://assess-public.taichung.gov.tw/ImportantWork/ConstructionDetail/011527293'],
    readingEquipment: { laptop: true, outlet: true },
    accessNote: '全館週二至週六 08:30–21:00、週日 08:30–17:30。新社分館公告曾列本館為自修替代地點。2025 年 12 月的樓層導覽列有 2 樓自修室，館舍介紹列 0 席。2026 年 8 月館內樓層牌列閱覽、研習、多功能及展覽空間，11 月官方活動確認 2 樓有特展區及多功能教室。2、3 樓閱覽席有檯燈，7 月到館照片確認部分靠窗閱覽桌可充電。館內有 6 席公用電腦，須現場登記。市府預告 2027 年 1 月至 7 月進行閱讀環境優化工程，服務異動及 2 樓獨立自修室規則待館方確認。',
    areaUpdates: [{ name: '2 樓自修室（開放待確認）', kind: 'study', slots: null, access: null,
      equipment: {}, sources: [dongshiGuide, dongshiIntro, dongshiVisit] }],
  },
  臺中市和平區立圖書館: { website: heping,
    sources: [hepingRules, hepingCurrentRules, hepingPdf, hepingReopening, hepingClosed, hepingExtension, holidays2026, election2026,
      'https://www.xinshe.taichung.gov.tw/media/1407885/和平區公所函.pdf',
      'https://www.facebook.com/permalink.php?story_fbid=pfbid027VSbS21r1RowNSaNThVtPq4NpkZRYoDEC6WiXkqp8N83ksi1ACYuRCaoRprkwo6nl&id=100069588254904',
      'https://www.facebook.com/permalink.php?story_fbid=pfbid0Q4vrYmEveUiTtrzetEAEL23f4bYTXUvmaL6i81jZwyM1BrasA65bm19TT9xhCJHXl&id=100069588254904'],
    accessNote: '館方確認 2026 年 11 月 1 日為整修後正式開館首日。一般閱覽週二至週日 08:00–17:00，中午照常開放，週一及國定假日休館。11 月 28 日投票日的開館情況待館方公告。館方復館後公告使用 2 樓會議室辦理講座及織布課程。館內使用自建無線網路，原 iTaichung 熱點已停用。筆電、平板及手機限指定區域充電，禁止自備延長線及轉接插頭。指定充電區是否設有閱覽座位及自習室的樓層、時段、入場資格和設備仍待確認。',
    closures: [
      { from: '2025-12-30', until: '2026-06-08', reason: '原館耐震補強期間暫停閱覽及自習服務', url: hepingExtension },
      { from: '2026-06-09', until: '2026-06-09', reason: '和平區公告停止上班', url: 'https://www.personnel.taichung.gov.tw/3294704/post' },
      { from: '2026-07-12', until: '2026-07-12', reason: '和平區公告停止上班', url: 'https://www.personnel.taichung.gov.tw/27164/27167/27170/3319476' },
      { from: '2026-10-23', until: '2026-10-23', reason: '薔琵颱風期間臺中市公告停止上班',
        url: 'https://www.personnel.taichung.gov.tw/27164/27167/27170/3398875' },
      { from: '2026-10-24', until: '2026-10-24', reason: '薔琵颱風期間臺中市公告停止上班',
        url: 'https://www.heping.taichung.gov.tw/983338/983410/983415/4082172' },
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
