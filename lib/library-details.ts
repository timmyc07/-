import type { Area, Library } from './study.ts';
import { libraryStudyHours } from './library-study-hours.ts';
import { libraryCalendar } from './library-calendars.ts';
import { kaohsiungHoursSource, kaohsiungStudyRoom } from './kaohsiung-study-rules.ts';
import { tainanStudyRoom } from './tainan-study-rules.ts';
import { taipeiStudyRoom } from './taipei-study-rules.ts';

export type LibraryDetail = { url: string; address: string; hours?: string; facilities?: string[] };

const buildingClosures: Record<string, Library['closures'][number] | undefined> = {
  'plis-37cd73be99573999d94d': {
    from: '2026-03-05', reason: '瑞穗原館耐震補強暫停開放。借閱服務移至溫泉路一段 1 號臨時圖書館（瑞穗站後站對面）。',
    url: 'https://www.juisui.gov.tw/News_Content.aspx?n=3419&s=204355',
  },
  'plis-2fcff6be9344e712594c': {
    from: '2022-03-01', reason: '宜蘭縣文化局圖書館因縣級圖書館總館工程閉館，復館日期以館方公告為準。',
    url: 'https://www.suao.gov.tw/News_Content.aspx?n=9043&s=385366&sms=13359',
  },
  'plis-5b3805f2ce866586020e': {
    from: '2026-04-15', reason: '新竹市圖書館總館閉館重建中，復館日期以館方公告為準。',
    url: 'https://library.hccg.gov.tw/chhcml/app/data/view?id=18&module=userTerm&serno=b39fff74-7075-46ee-85c5-dee460b6f208',
  },
  'plis-eb5cc227330385ea9b00': {
    from: '2026-03-02', reason: '自 2026 年 3 月 2 日起閉館施工，復館日期以館方公告為準。',
    url: 'https://www.cna.com.tw/postwrite/chi/425420',
  },
  'plis-79f43b2ba26bb9afade0': {
    from: '2026-01-01', reason: '崎頂分館自 2026 年 1 月 1 日起因搬遷至埔頂分館停止開放。',
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/02',
  },
};

const xinyuanUrl = 'https://www.cultural.pthg.gov.tw/library/cp.aspx?n=CDFE6D1C65C796B9&s=EBBCF8C0C79D379A';
const xinyuanHours = '週二至週日 08:00–12:00、13:00–17:00。週一、國定假日及每月最後一個星期四休館。';
const serviceUpdates: Record<string, { url: string; note: string } | undefined> = {
  'plis-f84b77b25e9ffc2013e9': {
    url: 'https://www.tnpl.tn.edu.tw/n15459485893940237436/n1Content',
    note: '原館施工延長至 2027 年 1 月 25 日。社教中心 A 棟 1 樓臨時櫃檯提供預約取書、還書、續借及辦證。週二至週五 08:30–20:30、週六至週日 09:00–16:30，週一及國定假日休息。',
  },
  'plis-e94c48945a092b5818d8': {
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11048',
    note: '縣政九路館各樓層已恢復開放。自 9 月 12 日起暫停館內調閱、超商借書、贈書及好書交換，自 10 月 20 日起暫停受理指定本館為取書館的新預約。',
  },
  'plis-e3c1d8e816d9e6061a7d': {
    url: 'https://www.kmdn.gov.tw/1117/1271/1272/590112/',
    note: '北棟自 2026 年 9 月 15 日起整修暫停開放，南棟持續服務。',
  },
};
const localHours: Record<string, { url: string; hours: string; studyRoom?: true; supersedesDirectory?: true } | undefined> = {
  'plis-e2c2e5a82e7e92aa1179': {
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=016&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '福德分館週二至週五 09:00–20:30，週末 09:00–17:00，週一及國定假日休館。',
    supersedesDirectory: true,
  },
  'plis-838b908932f56e7b1d22': {
    url: 'https://www.nankan.gov.tw/chhtml/Detail/2221?mcid=92857',
    hours: '週一及週三至週日 09:00–17:00。週二休館。',
    supersedesDirectory: true,
    studyRoom: true,
  },
  'plis-f3080ccd8c34dad70222': {
    url: 'https://www.penghu.gov.tw/phhcc/home.jsp?id=67',
    hours: '書庫、兒童室、期刊區及視聽室週三至週日 09:00–21:00。讀者自修室週一、週二 08:30–17:30，週三至週日 08:30–21:00。自修室於國定假日及每月最後一個星期二休館。',
    supersedesDirectory: true,
  },
  'plis-1d71cbf4cd1d410256ad': {
    url: 'https://www.ji-an.gov.tw/library/data/5?cate=14',
    hours: '依吉安鄉立圖書館官網，週三至週五 08:30–20:30，週二、週六及週日 08:30–17:00。週一及國定紀念日休館。',
    supersedesDirectory: true,
  },
  'plis-898020f5dd3a533a9ee3': {
    url: 'https://library.hccc.gov.tw/sp.asp?ctNode=930&mp=20&xItem=6889&xdurl=mp200ap%2Fbranch.asp',
    hours: '臨時館位於文化局園區演藝堂地下 1 樓。週二至週五 09:00–20:00，週末 09:00–18:00。週一及國定假日休館。',
    supersedesDirectory: true,
  },
  'plis-f115f1f71be7cccd30e1': {
    url: xinyuanUrl,
    hours: xinyuanHours + ' 縣府館舍頁註明二樓樓梯有安全疑慮，目前只開放一樓。',
    supersedesDirectory: true,
  },
  'plis-674920ab9a5621eaf6cf': {
    url: 'https://www.cna.com.tw/postwrite/chi/431519',
    hours: '週二至週日 09:00–21:00。週末館藏區開放至 17:30。週一、國定假日及每月最後一日休館。',
    studyRoom: true,
    supersedesDirectory: true,
  },
  'plis-3dc026b916c043fe287e': {
    url: 'https://www.changkang.gov.tw/news/news1/detail/9834',
    hours: '自 2026 年 11 月 9 日起，整修期間閱覽區週二至週日 08:00–17:00，暫停借閱。週一及國定假日休館。每月最後一日清館，遇週一、國定假日或例假日提前或順延一日。',
    supersedesDirectory: true,
  },
  'plis-6c9e30dc1c6abf7a17d4': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7933',
    hours: '週二至週六 09:00–21:00，週日 09:00–17:00。週一及國定假日休館。',
    studyRoom: true,
  },
  'plis-29ea3972b0a938ef5d16': {
    url: 'https://library.hccg.gov.tw/chhcml/app/digital/view?id=55&module=branchLibrary&serno=ad675c74-33d4-4c43-b6cc-e1ee7b55dc50',
    hours: '週二至週日 09:00–17:00。週一、選舉日及館方公告的民俗節日休館。',
  },
  'plis-27e42cf8f073cee7c04f': {
    url: 'https://www.library.taichung.gov.tw/lib/content/index?Parser=1,108,630',
    hours: '週二至週六 08:30–21:00，週日 08:30–17:30。週一及國定假日休館。',
  },
  'plis-a141c3b5fc0e2accfd60': {
    url: 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=017&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '週一至週五 08:00–12:00、13:00–17:00。週六、週日及國定假日休館。',
  },
};
const hsinchuHoursOverride = {
  url: 'https://library.hccg.gov.tw/chhcml/app/data/view?id=18&module=userTerm&serno=b39fff74-7075-46ee-85c5-dee460b6f208',
  hours: '週二至週五 09:00–21:00，週六及週日 09:00–17:00。假日異動依館方公告。',
};

const comparableAddress = (value: string) => value.normalize('NFKC').replaceAll('台', '臺')
  .trim().replace(/^\d{3,6}(?=\s*\D)/, '').replace(/\s/g, '');

const hsinchuOpening = 'https://www.hclibraryopening.com.tw/';
const hsinchuFloorGuide = 'https://www.hclibraryopening.com.tw/%E8%AA%8D%E8%AD%98%E7%B8%BD%E5%9C%96';
const stellarOpening = 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11078';
const announcedLibraries: (Library & { city: string })[] = [
  {
    id: 'local-hsinchu-county-main', name: '新竹縣立總圖書館', city: '新竹縣', district: '竹北市',
    address: '新竹縣竹北市自強三路155號', types: ['公共圖書館'],
    website: hsinchuOpening, sources: [hsinchuOpening, hsinchuFloorGuide,
      'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11074'],
    openingHours: '試營運至 2026 年 11 月 15 日，09:00–21:00，週一休館。12 月 18 日預定正式開館。',
    studyRoom: true,
    facilities: ['地下 1 樓自修室', '閱報區', '兒童閱覽區', '視障服務區', '資訊檢索區', '討論小間', '汽機車停車場'],
    areas: [{ name: '地下 1 樓自修室', kind: 'study', slots: null, access: null,
      equipment: {}, sources: [hsinchuFloorGuide] }],
    closures: [{ from: '2026-11-16', until: '2026-12-17', reason: '試營運結束，12 月 18 日預定正式開館',
      url: hsinchuOpening }],
  },
  {
    id: 'local-zhubei-stellar', name: '竹北星際圖書館', city: '新竹縣', district: '竹北市',
    address: '新竹縣竹北市中正西路52號', types: ['公共圖書館'],
    website: stellarOpening, sources: [stellarOpening, 'https://www.openstreetmap.org/node/14355577123'],
    coordinates: { latitude: 24.8396572, longitude: 121.0036135 },
    openingHours: '試營運：週二至週四 09:00–20:30，週五至週日 09:00–24:00。週一休館，特殊日期依公告。',
    accessNote: '試營運開放館內閱覽，暫停外借、預約、還書、通閱、檢索電腦及視聽設備服務。',
    areas: [], closures: [],
  },
];

export function withAnnouncedLibraries(libraries: (Library & { city: string })[]) {
  return [...libraries, ...announcedLibraries.filter((announced) => !libraries.some((library) =>
    comparableAddress(library.address) === comparableAddress(announced.address)))];
}

const faxLocation = (value: string) => comparableAddress(value).replace(/-(?=\d)/g, '之');
const taichungFaxName = (value: string) => value.normalize('NFKC').replace(/\s/g, '')
  .replace(/^臺中市立圖書館/, '').replace(/(?:國立公共資訊圖書館精武分館|^精武圖書館$)/, '精武圖書館');

export function withTaichungDirectoryDetails(library: Library, directory: Library[]): Library {
  const hasHours = Boolean(library.openingHours || library.schedule?.length);
  if (library.fax && hasHours) return library;
  const name = taichungFaxName(library.name);
  const address = faxLocation(library.address);
  const [match, duplicate] = directory.filter((candidate) =>
    taichungFaxName(candidate.name) === name && faxLocation(candidate.address) === address);
  if (!match || duplicate || !address) return library;
  const fax = library.fax ?? match.fax;
  const openingHours = hasHours ? library.openingHours : match.openingHours;
  if (fax === library.fax && openingHours === library.openingHours) return library;
  return { ...library, fax, openingHours, sources: [...new Set([...library.sources, ...match.sources])] };
}

export function withLibraryDetail<T extends Library>(library: T, detail: LibraryDetail | undefined): T & Library {
  if (library.id === 'plis-1d5bc6bb745d6ead49e9' && library.address === '苗栗縣竹南鎮大厝里真如路562號') {
    detail = { url: 'https://www.chunan.gov.tw/cp.aspx?n=11120', address: library.address,
      hours: '每日 08:00–18:00，春節及國定假日休館。' };
  }
  if (library.id === 'plis-5931f90c2b78f1094592' && library.address === '屏東縣新園鄉仙吉村新田路22巷21號') {
    detail = { url: xinyuanUrl, address: library.address, hours: xinyuanHours };
  }
  if (!detail?.address || comparableAddress(detail.address) !== comparableAddress(library.address)) return library;
  const candidate = localHours[library.id];
  const local = !detail.hours || candidate?.supersedesDirectory ? candidate : undefined;
  const hoursOverride = ['plis-9709456f17abc6c6a512', 'plis-5929930cfc61bd687f1f'].includes(library.id)
    ? hsinchuHoursOverride : undefined;
  const closure = buildingClosures[library.id];
  const study = libraryStudyHours(library.id);
  const listed = Boolean(detail.facilities?.some((facility) => /^自[修習]室$/.test(facility)));
  const area: Area = {
    name: study?.name ?? '自修室', kind: 'study', slots: study?.slots ?? null, access: null, equipment: {},
    sources: [study?.url ?? (local?.studyRoom ? local.url : detail.url)],
  };
  const taipeiArea = taipeiStudyRoom(library, area, listed);
  const tainanArea = tainanStudyRoom(library.id, area);
  const kaohsiungArea = kaohsiungStudyRoom(library.id);
  const localArea = kaohsiungArea ?? tainanArea ?? localStudyRoom(library.id, taipeiArea ?? area);
  const studyRoom = Boolean(study || local?.studyRoom || listed || taipeiArea || tainanArea || kaohsiungArea);
  const calendar = libraryCalendar(library);
  const serviceUpdate = serviceUpdates[library.id];
  return {
    ...library,
    name: library.id === 'plis-e2c2e5a82e7e92aa1179' ? '新竹縣竹北市立圖書館福德分館' : library.name,
    openingHours: closure?.reason ?? library.openingHours ?? hoursOverride?.hours ?? local?.hours ?? detail.hours,
    calendarYears: calendar?.calendarYears ?? library.calendarYears,
    checkDates: calendar?.checkDates ? [...new Set([...(library.checkDates ?? []), ...calendar.checkDates])] : library.checkDates,
    closures: [...library.closures, ...(calendar?.closures ?? []), ...(closure ? [closure] : [])],
    accessNote: serviceUpdate?.note ?? library.accessNote,
    facilities: library.facilities ?? detail.facilities,
    studyRoom: library.studyRoom ?? (kaohsiungArea === null ? false : studyRoom || undefined),
    areas: studyRoom && kaohsiungArea !== null && library.studyRoom !== false && !library.areas.some(({ kind }) => kind === 'study')
      ? [...library.areas, localArea] : library.areas,
    sources: [...new Set([...library.sources, detail.url, ...(local ? [local.url] : []),
      ...(serviceUpdate ? [serviceUpdate.url] : []),
      ...(hoursOverride ? [hoursOverride.url] : []),
      ...(kaohsiungArea === null ? [kaohsiungHoursSource] : []),
      ...(calendar?.closures.map(({ url }) => url) ?? []), ...(closure ? [closure.url] : [])])],
  };
}

const taoyuanSeatSystem: Record<string, { url: string; seats?: number; name?: string } | undefined> = {
  'plis-9c317ee99e20f7ec3cd3': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/014', seats: 147 },
  'plis-0d8617adcdaa013618d9': { url: 'https://www.typl.gov.tw/kids/News/Content/2017' },
  'plis-0670e73215c152add507': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/038', seats: 50 },
  'plis-14dcd000784259e3f26c': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/021', name: '2 樓自修室', seats: 70 },
  'plis-a38508dd33caf0cfefdc': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/034', seats: 113, name: '1 樓自習室' },
  'plis-bb78c5df4d9aa277ab1c': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/041' },
};

function localStudyRoom(id: string, area: Area): Area {
  if (id === 'plis-2bbbdcd83068ffcf8f4f') {
    return { ...area, name: '2 樓多功能自修室', seats: 54,
      entryNote: '改造後於 2026 年 11 月 1 日開始試營運。',
      sources: [...area.sources, 'https://www.govserv.org/TW/Unknown/103898815758341/新埔鎮公所',
        'https://udn.com/news/story/7324/9851791'] };
  }
  if (id === 'plis-946f82daf9ca97d241ba') {
    return { ...area, entryNote: '國立公共資訊圖書館名錄列出 5 至 6 月自修室週二至週日 08:00–21:00，週一及國定假日休館。' };
  }
  if (id === 'plis-e94c48945a092b5818d8') {
    return { ...area, seats: 141, access: 'walk-in',
      entryNote: '自由入座，請勿預佔座位。一般閱覽座位 138 席，另有身心障礙人士專用席 3 席。',
      sources: [...area.sources, 'https://hcplibrary.hchcc.gov.tw/wSite/public/Attachment/f1766106527415.pdf',
        'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4302&mp=1&xItem=8085'] };
  }
  if (id === 'plis-703e62be51f0cd3f7e93') {
    return { ...area, entryNote: '自 2026 年 6 月 1 日起，國定假日 08:00–20:00 開放。',
      sources: [...area.sources, 'https://mlc.edu.tw/System/mainedu/News/Detail.php?ID=53723'] };
  }
  if (id === 'plis-838b908932f56e7b1d22') {
    return { ...area, name: '1 樓自修區',
      sources: [...area.sources, 'https://isp.ncl.edu.tw/files/file_pool/1/0N087443665349792009/110連江縣.pdf'] };
  }
  if (id === 'plis-f3080ccd8c34dad70222') {
    return { ...area, equipment: { laptop: true },
      entryNote: '筆電等電子設備請保持靜音。請勿預佔座位，考季期間可能不定時清場。' };
  }
  if (id === 'plis-8e698a4770cf01e3875e') {
    return { ...area, seats: 147, access: 'conditional',
      entryNote: '供一般讀者自修。館方請 12 歲以下讀者使用兒童閱覽室。' };
  }
  if (id === 'plis-d4bafe538b622515b304') {
    return { ...area, name: '3 樓自習室', seats: 100,
      sources: [...area.sources, 'https://www.changhua.gov.tw/RowContent/2242'] };
  }
  if (id === 'plis-424ebe1541690abe5b92') {
    return { ...area, name: 'B1 讀者自習室', seats: 42,
      sources: [...area.sources, 'https://www.chcg.gov.tw/TSO/Puxin/07other/main.aspx?main_id=12367'] };
  }
  if (id === 'plis-61f904e8f436ea8fc25d') {
    return { ...area, access: 'walk-in', equipment: { laptop: false },
      entryNote: '自由入座，每人一席。自修室限閱讀，筆電及平板請至資訊閱讀區。每月最後一個星期一清潔休館。',
      sources: [...area.sources, 'https://ctrl.chcg.gov.tw/main/main_act3/mainV2.aspx?act_id=45&main_id=33233'] };
  }
  const changhuaMain = id === 'plis-b19f4a632868ac1ed335';
  if (changhuaMain || id === 'plis-f935063eced556c94ad8') {
    return { ...area, seats: changhuaMain ? 70 : 38, access: 'card', regionalCard: 'changhua',
      entryNote: '持彰化縣公共圖書館個人借閱證線上預約或現場登記，須於時段開始後 30 分鐘內刷證報到。',
      reservation: 'https://ireserve.toread.bocach.gov.tw/sm/home_web.do',
      sources: [...area.sources, changhuaMain ? 'https://lib.bocach.gov.tw/cp.aspx?n=933'
        : 'https://www.chcg.gov.tw/TSO/tianzhong/04bulletin/bulletin02_con.aspx?bull_id=392826'] };
  }
  if (id === 'plis-d7b92d13f890b0fd9998') {
    return { ...area, name: '3 樓自修區', sources: [...area.sources, 'https://zuhu.yunlin.gov.tw/sihhuLIB.htm'] };
  }
  if (id === 'plis-674920ab9a5621eaf6cf') {
    return { ...area, name: '自修區', seats: 98,
      sources: [...area.sources, 'https://culture.taitung.gov.tw/activity/臺東縣立圖書館各式活動'] };
  }
  if (id === 'plis-5929930cfc61bd687f1f') {
    return { ...area, seats: 216, equipment: { outlet: true },
      sources: [...area.sources, 'https://library.hccg.gov.tw/chhcml/app/digital/view?id=55&module=branchLibrary&serno=15f84f6d-dc3c-4b82-8e80-df80b371c164'] };
  }
  if (id === 'plis-6c9e30dc1c6abf7a17d4') {
    return {
      ...area, access: 'card', regionalCard: 'keelung', seats: 109,
      entryNote: '持基隆市圖個人借閱證，線上預約或到館登記。每次原則為 1–3 小時，現場零星時段至少 30 分鐘。',
      reservation: 'https://ireserve.klccab.gov.tw/',
      sources: [...area.sources, 'https://kllib.klcg.gov.tw/cp.aspx?n=9043',
        'https://kllib.klcg.gov.tw/News_Content.aspx?_CSN=150&n=7789&s=18148&sms=12521'],
    };
  }
  const taoyuan = taoyuanSeatSystem[id];
  if (taoyuan) {
    const main = id === 'plis-0d8617adcdaa013618d9';
    const reservation = 'https://spaceme.typl.gov.tw/';
    return {
      ...area, name: taoyuan.name ?? area.name, access: 'card', regionalCard: 'taoyuan', seats: taoyuan.seats,
      equipment: main ? { ...area.equipment, laptop: false } : area.equipment,
      entryNote: '持桃園市圖個人借閱證或市民卡登記，預約席與當日席依座位系統顯示。'
        + (main ? '7 樓自修室為極靜區，使用筆電請移至同樓層筆電區。' : ''),
      reservation,
      sources: [...new Set([...area.sources, taoyuan.url, 'https://www.typl.gov.tw/zh-tw/Reader/RegulationContent/6', reservation])],
    };
  }
  return area;
}
