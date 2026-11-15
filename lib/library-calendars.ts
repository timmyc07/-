import { minutes, type Closure, type Library } from './study.ts';
import { kaohsiungStudyRoom } from './kaohsiung-study-rules.ts';

const taipeiUrl = 'https://tpml.gov.taipei/cp.aspx?n=141EFA8D46038957&s=839324A30786DF77';
const taipeiZhongshanElection = 'https://doit.gov.taipei/News_Content.aspx?n=E3D88B653EACBF6E&s=1CBA72450CC8FCAE&sms=78D644F2755ACCAA';
const taipeiBranchClosures: Record<string, Closure[] | undefined> = {
  'plis-4a5392763b505085c4b0': [
    { from: '2026-11-27', until: '2026-11-27', time: { start: minutes('17:30'), end: 24 * 60 },
      reason: '配合選務作業提前閉館', url: taipeiZhongshanElection },
    { from: '2026-11-28', until: '2026-11-29', reason: '配合選務作業閉館', url: taipeiZhongshanElection },
  ],
  'plis-43a6f9462110b6734cd6': [
    { from: '2026-11-27', until: '2026-11-28', reason: '配合投開票所作業閉館',
      url: 'https://reading.tpml.gov.taipei/News_Content.aspx?n=B3B7F57C7B16FDE6&s=51DAF6801B3A8125&sms=78D644F2755ACCAA' },
  ],
  'plis-4235a1e69db7bb767466': [
    { from: '2026-11-26', until: '2026-11-29', reason: '配合選務作業閉館',
      url: 'https://www.gov.taipei/News_Content.aspx?n=D0042A87C2F0270A&s=42805488DDD562C0&sms=78D644F2755ACCAA' },
  ],
  'plis-e3287dc94a64c9288833': [
    { from: '2026-11-28', until: '2026-11-29', reason: '配合選務作業閉館',
      url: 'https://tpml.gov.taipei/News_Content.aspx?n=E492D531630BC406&s=BFFCCC6F19D10582&sms=78D644F2755ACCAA' },
  ],
  'plis-a41c03305803788dff81': [
    { from: '2026-10-30', until: '2026-12-29', reason: '地坪及屋頂防水施工閉館，預約書請改至安康民眾閱覽室取書。',
      url: 'https://doit.gov.taipei/News_Content.aspx?n=E3D88B653EACBF6E&s=FBDA637F57E66E70&sms=78D644F2755ACCAA' },
  ],
  'plis-edeec13b64c0ca4d0965': [
    { from: '2026-10-30', until: '2027-02-18', reason: '空調及監控設備施工閉館，臨時櫃檯提供辦證、還書及預約取書。',
      url: 'https://reading.tpml.gov.taipei/News_Content.aspx?n=B3B7F57C7B16FDE6&s=13FADA52FA4C8241&sms=78D644F2755ACCAA' },
  ],
  'plis-556af005b3614de06ca7': [
    { from: '2026-09-01', until: '2026-12-20', reason: '館舍及廁所整修閉館，預約書請改至稻香分館取書。',
      url: 'https://doit.gov.taipei/News_Content.aspx?n=E3D88B653EACBF6E&s=3485793297A17F05&sms=78D644F2755ACCAA' },
  ],
};
export const penghuMainUrl = 'https://www.phlib.nat.gov.tw/wSite/sp?ctNode=5236&mp=1&orgId=001&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp';
const newTaipeiUrl = 'https://www.library.ntpc.gov.tw/singlehtml/be937c4bcb74427ca3d3c8fd5b4704b9';
const newTaipeiMayClosing: Record<string, { time: string; url: string } | undefined> = {
  'plis-2f3bedb51e2b23a23a59': { time: '21:00', url: 'https://www.ntpc.gov.tw/ch/home.jsp?dataserno=febf72596dc925a16b4d281c6955a96b&id=31' },
  'plis-328bb20a01970d84f947': { time: '21:00', url: 'https://www.ntpc.gov.tw/ch/home.jsp?dataserno=febf72596dc925a173d813580b75cf03&id=31' },
  'plis-b5812bfda43fbd06e2a4': { time: '21:00', url: 'https://www.ntpc.gov.tw/ch/home.jsp?dataserno=febf72596dc925a116b6e5ab6dbf1b4b&id=31' },
  'plis-5700fc946f2296c185af': { time: '17:00', url: 'https://www.library.ntpc.gov.tw/multiplehtml/Info%3Bjsessionid%3D367190877F99A6B453912C7EC18A297F?categoryCode=007' },
};
const nationalTaiwanUrl = 'https://www.ntl.edu.tw/wSite/ct?ctNode=1711&mp=1&xItem=58536';
const electionUrl = 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=353f6e7dda484242820ea153ab0eb4a0';
const newTaipeiElectionEve: Record<string, { start: number; url: string } | undefined> = {
  'plis-a2efc5dfbc94ad322d3d': { start: 12, url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=029589630b684964945529418472ef30' },
  'plis-b9568520f14810d9931a': { start: 12, url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=cc172c75856b4421bcfb3a655534abaf' },
  'plis-4b5e39e13cd44319599f': { start: 13, url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=4ded2dc334a04c0cb6e638e839b18870' },
};
const newTaipeiBranchClosures: Record<string, { dates: string[]; branchId: string } | undefined> = {
  'plis-e560724330a3485ec121': { dates: ['11-23'], branchId: '7ab6eefb8a0542c591c242c79fb36989' },
  'plis-039d55a9f83160fc0e08': { dates: ['11-24'], branchId: 'e981c14a1847473c8d038b4c19656eab' },
  'plis-b5da9bcc084818ab9965': { dates: ['11-25'], branchId: 'f97aa14cccf645d29276a969bc9d8c53' },
  'plis-fbaad21dca36d8e7e69b': { branchId: '75c9e134b56247d1be0b12771f4c958c', dates: ['05-18'] },
  'plis-a40a9a0b96d74b54147e': { branchId: '3b882237569f42d3a610b8ccca388ae1', dates: ['09-07'] },
  'plis-980d010f6445faec01ae': { branchId: '2cbb91b2f45849a0948f082ecd02d71a', dates: ['04-13'] },
  'plis-c770870780f2e3994cd2': { branchId: '5cbaf24850354822b32b7907ef7945b3', dates: ['04-29'] },
  'plis-49a9a08d63a7140714e4': { branchId: 'b1ae93fdc1244b80b9af364596b2b581', dates: ['04-21'] },
  'plis-c919871190687b80121b': { branchId: 'c5ce4004327d4cc6b186029af9f34309', dates: ['01-17', '02-01', '09-05', '10-30'] },
  'plis-b80a3d048342d8ee000b': { branchId: '733f9cf3e7014b5d8539266c0a4841b3', dates: ['10-23'] },
  'plis-2d54a2fbad4e1969f16d': { branchId: '194d0fedaca34b6b8d425d9bf0d6e405', dates: ['10-28'] },
  'plis-5946ac04ea837232b6f2': { branchId: '05bf4bb286764b73a497592be0c58b96', dates: ['07-26', '10-27'] },
  'plis-4c6f0d21ba83e97a256f': { branchId: 'c5ad611b99bf4d9eb9e613cbde6dfa2d', dates: ['09-21', '09-22', '09-23'] },
  'plis-86ecd986295f288ae207': { branchId: '3b471135eea9495cb54e933a109758dc', dates: ['05-04'] },
  'plis-e2ead3dfd0dc3c336fa2': { branchId: 'f6228a8566af4f7ab5c5276941dd6265', dates: ['01-12'] },
  'plis-6ce77ef085504435e7e7': { branchId: '1c60b08acab0482dafdef8a34ae50281', dates: ['01-05'] },
  'plis-85f7a6ce9e0a4091966e': { branchId: '6f4d0b6a06ea4e1dab0224428eaf4052', dates: ['04-20'] },
  'plis-5e3e0d107165abbc64e5': { branchId: 'bfc1b820203c4aae9ea7cf4d99827c87', dates: ['05-29'] },
  'plis-4b5e39e13cd44319599f': { branchId: '38856979fb6240dab5705b60f0daf36d', dates: ['05-11'] },
  'plis-c488aeda8f5a5cec86b1': { branchId: '60713de7e75a4a6dbdd45deaf4d5c44e', dates: ['09-07'] },
};
const xindianInventoryDates: Record<string, string[] | undefined> = {
  'plis-b9568520f14810d9931a': ['10-29', '10-30'],
  'plis-4d0d0cfbe3a9cd856174': ['10-27'],
  'plis-5f86e9631601d52f3f76': ['10-26'],
  'plis-a2efc5dfbc94ad322d3d': ['10-29'],
  'plis-040b8aff6cd2e60cbd1e': ['10-29'],
  'plis-b3c324c71459423ffadb': ['10-27'],
  'plis-5c0e70dee55211b503e1': ['10-26'],
};
const sanzhiTransitionUrl = 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=6818c805a79440a193f8c5c43cf823d2';
const newTaipeiServiceClosures: Record<string, Closure[] | undefined> = {
  'plis-ccd76885634412ccaa4a': [
    { from: '2026-07-13', until: '2026-08-23', reason: '配合新館啟用整備，原臨時館暫停開放。', url: sanzhiTransitionUrl },
    { from: '2026-08-24', until: '2026-11-02', reason: '新館閱覽及自修暫停開放，兒童室臨時服務臺提供還書及預約取書。', url: sanzhiTransitionUrl },
  ],
  'plis-dce1cb93599d11a23eb5': [
    { from: '2026-09-21', until: '2026-10-28', reason: '防水改善工程期間暫停館內閱覽與自修，服務櫃臺提供還書及預約取書。',
      url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=d78033ac1e274e718e609fe51ed8d490' },
  ],
  'plis-35fd0d403d4fe15ada5e': [
    { from: '2026-09-21', until: '2026-10-02', reason: '公安改善工程期間暫停館內閱覽，1 樓服務櫃臺提供借還書及預約取書。',
      url: 'https://www.library.ntpc.gov.tw/multiplehtml/Info%3Bjsessionid%3D89DB92A64B859424AE9C82E43ED8E36E?categoryCode=007' },
  ],
};
const dongshengClosure: Closure = {
  from: '2026-12-01', reason: '樹林東昇分館因都更閉館，臨時服務據點設於樹林區客家藝文館（中洲街 5-2 號）。',
  url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=90269135cd3b46ccac221df193f78e60',
};
const keelungUrl = 'https://kllib.klcg.gov.tw/News_Content.aspx?n=7789&s=16436&sms=12521';
const taoyuanUrl = 'https://www.typl.gov.tw/zh-tw/News/Content/1067';
const kaohsiungUrl = 'https://www.ksml.edu.tw/LibNews/Details.aspx?Parser=9,4,33,,,,15495';
export const chiayiCountyReadingRules = 'https://www.cycab.gov.tw/wSite/ct?ctNode=6267&mp=1&xItem=9895';
const tainanMainUrl = 'https://www.tnpl.tn.edu.tw/u4914263388070917076/a1';
export const tainanTuchengUrl = 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u5069505906890802294';
const hsinchuCityHours = 'https://library.hccg.gov.tw/chhcml/app/data/view?id=18&module=userTerm&serno=1031a73e-224c-4ecd-a33a-496ad144123e';
export const yuanlinLibraryRules = 'https://files.chcg.gov.tw/files/58_20250124134738385_彰化縣員林市立圖書館圖書資料借閱規定-1140123修正.pdf';
const miaoliLibraryHours = 'https://opendata.miaoli.gov.tw/OpenDataDetail.aspx?n=9404&s=1811';
export const sanwanLibraryHours = 'https://www.sanwan.gov.tw/News_Content.aspx?n=9906&s=785817';
const electionClosureRules: Record<string, string> = {
  'plis-703e62be51f0cd3f7e93': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000174',
  'plis-eaf18916c54c8e1fffc3': miaoliLibraryHours,
  'plis-5214bc11151c1cde5bf4': miaoliLibraryHours,
  'plis-687f7b5047ffb263f313': miaoliLibraryHours,
  'plis-4d279c7315db0ef22427': miaoliLibraryHours,
  'plis-296440e3a1f9d236a570': miaoliLibraryHours,
  'plis-0f8ce5ec67aa7c253fe8': miaoliLibraryHours,
  'plis-189e26aab70c5cb51cdd': miaoliLibraryHours,
  'plis-85a3abe63d4ba7d005b7': miaoliLibraryHours,
  'plis-8258ecedb33967785152': miaoliLibraryHours,
  'plis-cb71eb01e4c6590c8846': miaoliLibraryHours,
  'plis-1c304ff42dd5276d9acf': miaoliLibraryHours,
  'plis-1c030fa3616cfb99d6fc': miaoliLibraryHours,
  'plis-4ee8f2321103a6f17ad7': miaoliLibraryHours,
  'plis-708a19a863b754e58e04': sanwanLibraryHours,
  'plis-7417038e0db9b35c62ea': 'https://www.houlong.gov.tw/cp.aspx?n=4134',
  'plis-12a529595d2715dda629': yuanlinLibraryRules,
  'plis-016c903b9ad9d1b886d6': yuanlinLibraryRules,
  'plis-e2293e37a8a158591761': 'https://lib.bocach.gov.tw/cp.aspx?n=1206',
  'plis-674920ab9a5621eaf6cf': 'https://culture.taitung.gov.tw/news/【休館公告】11-28-日休館一日',
  'plis-fe9c622fb1bdd5279ec1': 'https://matsucc.gov.tw/莒光鄉圖書館/',
  'plis-0f447bbe2c470b97e41a': 'https://matsucc.gov.tw/莒光鄉圖書館-東莒分館/',
  'plis-a382f4004c63510e6b53': 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=007&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-3a8fa4c8db9589758aef': 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=011&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-e94c48945a092b5818d8': 'https://www.hchcc.gov.tw/Tw/Common/SinglePage?filter=55A4FB62-998F-4818-BDE2-08AF8B3245C2',
  'plis-0a0cb9e669998c949020': 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=003&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-e2c2e5a82e7e92aa1179': 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=016&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-24ed27c19953ccb5f0c4': 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=004&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-bda0333882d76e416b20': 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=009&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-645a77676fc64f962dcf': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000306',
  'plis-34ea4e3647b8191ffef9': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000307',
};
const yearEndHolidayRules: Record<string, string | undefined> = {
  'plis-e641450483afbb290910': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000442',
  'plis-71debe76739635a0cacc': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000450',
  'plis-24d66dc05128f8f7593d': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000311',
  'plis-271e4d234a01bec2a0b0': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000326',
};

function closureDates(year: number, url: string, dates: string[], reason: string): Closure[] {
  return dates.map((date) => ({ from: year + '-' + date, until: year + '-' + date, reason, url }));
}

function holidays(year: number, url: string, springEnd: string, dragonBoat: string, midAutumn: string) {
  const days = [
    ['01-01', '開國紀念日休館'], ['02-28', '和平紀念日休館'], ['04-04', '兒童節休館'],
    ['04-05', '清明節休館'], ['05-01', '勞動節休館'], [dragonBoat, '端午節休館'],
    [midAutumn, '中秋節休館'], ['09-28', '教師節休館'], ['10-10', '國慶日休館'],
    ['10-25', '臺灣光復暨金門古寧頭大捷紀念日休館'], ['12-25', '行憲紀念日休館'],
  ];
  return [
    ...days.flatMap(([day, reason]) => closureDates(year, url, [day], reason)),
    { from: year + (year === 2027 ? '-02-04' : '-02-15'), until: year + '-' + springEnd, reason: '春節休館', url },
  ];
}

const taipei2026 = [
  ...holidays(2026, taipeiUrl, '02-20', '06-19', '09-25'),
  ...closureDates(2026, taipeiUrl, ['02-05', '03-05', '04-02', '05-07', '06-04', '07-02', '08-06', '09-03', '10-01', '11-05', '12-03'], '圖書整理清潔日休館'),
  ...closureDates(2026, taipeiUrl, ['11-28'], '選舉日休館'),
];
const taipei2027 = [
  ...holidays(2027, taipeiUrl, '02-09', '06-09', '09-15'),
  ...closureDates(2027, taipeiUrl, ['01-07', '03-04', '04-01', '05-06', '06-03', '07-01', '08-05', '09-02', '10-07', '11-04', '12-02'], '圖書整理清潔日休館'),
];
const newTaipei2026 = [
  ...holidays(2026, newTaipeiUrl, '02-20', '06-19', '09-25'),
  ...closureDates(2026, newTaipeiUrl, ['02-21', '06-25'], '調整開放時間，17:00 閉館')
    .map((closure) => ({ ...closure, time: { start: minutes('17:00'), end: 24 * 60 } })),
  ...closureDates(2026, newTaipeiUrl, ['01-29', '02-26', '03-26', '04-30', '05-28', '07-30', '08-27', '09-24', '10-29', '11-26', '12-31'], '圖書整理清館日休館'),
  ...closureDates(2026, electionUrl, ['11-28'], '選舉日休館'),
];
const nationalTaiwan2026 = [
  ...holidays(2026, nationalTaiwanUrl, '02-19', '06-19', '09-25'),
  ...closureDates(2026, nationalTaiwanUrl, ['11-28'], '選舉及公投日休館'),
];
const keelung2026 = [
  ...holidays(2026, keelungUrl, '02-21', '06-19', '09-25'),
  ...closureDates(2026, keelungUrl, ['11-28'], '選舉日休館'),
];
const taoyuan2026 = [
  ...holidays(2026, taoyuanUrl, '02-21', '06-19', '09-25'),
  ...closureDates(2026, 'https://www.typl.gov.tw/zh-tw/Closed/Content/77', ['07-10'], '天然災害停班休館'),
  ...closureDates(2026, 'https://www.typl.gov.tw/zh-tw/Closed/Content/78', ['07-11'], '天然災害停班休館'),
  ...closureDates(2026, 'https://www.typl.gov.tw/zh-tw/Closed/Content/85', ['10-23'], '薔琵颱風休館'),
  ...closureDates(2026, 'https://www.typl.gov.tw/zh-tw/Closed/Content/88', ['10-24'], '薔琵颱風休館'),
  ...closureDates(2026, taoyuanUrl, ['01-29', '02-26', '03-26', '04-30', '05-28', '06-25', '07-30', '08-27', '09-24', '10-29', '11-26', '12-31'], '圖書整理清館日休館'),
  ...closureDates(2026, 'https://www.typl.gov.tw/zh-tw/Closed/Content/90', ['11-28'], '選舉日休館'),
];
const kaohsiung2026 = [
  ...holidays(2026, kaohsiungUrl, '02-19', '06-19', '09-25'),
  ...closureDates(2026, kaohsiungUrl, ['04-06', '10-26'], '補假日休館'),
  ...closureDates(2026, kaohsiungUrl, ['11-28'], '選舉日休館'),
];

function monthlyClosures(year: number, weekday: number | null, url: string, reason: string) {
  const dates = Array.from({ length: 12 }, (_, month) => {
    const last = new Date(Date.UTC(year, month + 1, 0));
    if (weekday !== null) last.setUTCDate(last.getUTCDate() - (last.getUTCDay() + 7 - weekday) % 7);
    return last.toISOString().slice(5, 10);
  });
  return closureDates(year, url, dates, reason);
}

export const penghuStudyClosures = [2026, 2027].flatMap((year) =>
  monthlyClosures(year, 2, penghuMainUrl, '閱覽室每月最後一個星期二清潔休室'));

export function libraryCalendar(library: Library): Pick<Library, 'calendarYears' | 'closures' | 'checkDates'> | undefined {
  if (library.id === 'plis-27e5ed75c8013b01c228') {
    const reason = '閱覽及自修空間不開放。非國定假日僅提供預約書取書。';
    return {
      closures: [2026, 2027].flatMap((year) => {
        const january = new Date(Date.UTC(year, 0, 1));
        const firstTuesday = 1 + (2 - january.getUTCDay() + 7) % 7;
        const tuesdays = Array.from({ length: 52 }, (_, week) =>
          new Date(Date.UTC(year, 0, firstTuesday + 7 * week)).toISOString().slice(5, 10));
        return [...closureDates(year, tainanTuchengUrl, tuesdays, reason),
          ...monthlyClosures(year, 5, tainanTuchengUrl, reason)];
      }),
    };
  }
  if (['plis-c45011eb98a75a2b9c10', 'plis-cc40d48dc090e913387c', 'plis-462b4877085902245ddb'].includes(library.id)) {
    const url = 'https://www.lotong.gov.tw/cp.aspx?n=17720';
    return { closures: [
      ...[2026, 2027].flatMap((year) => monthlyClosures(year, null, url, '每月最後一日休館')),
      ...closureDates(2026, url, ['12-25'], '依館方國定假日休館規定，行憲紀念日休館'),
      ...closureDates(2027, url, ['01-01'], '依館方國定假日休館規定，開國紀念日休館'),
    ] };
  }
  const yearEndHolidayRule = yearEndHolidayRules[library.id];
  if (yearEndHolidayRule) {
    return { closures: [
      ...closureDates(2026, yearEndHolidayRule, ['12-25'], '依館方國定假日休館規定，行憲紀念日休館'),
      ...closureDates(2027, yearEndHolidayRule, ['01-01'], '依館方國定假日休館規定，開國紀念日休館'),
    ] };
  }
  if (library.id === 'plis-11572b8b7a161948f5fb') {
    return { closures: [
      ...closureDates(2026, 'https://www.mlvillage.gov.tw/latestevent/Details.aspx?Parser=9,3,23,,,,9406',
        ['11-28'], '選舉日休館'),
      ...closureDates(2026, 'https://www.mlvillage.gov.tw/latestevent/Details.aspx?Parser=9,3,23,,,,9408',
        ['12-25'], '行憲紀念日休館'),
    ] };
  }
  if (library.id === 'plis-3d9a951164210abf4cb8') {
    return { closures: closureDates(2026, 'https://www.mlvillage.gov.tw/content/index.aspx?Parser=1,4,153,31',
      ['12-25'], '依分館國定假日休館規定，行憲紀念日休館') };
  }
  if (library.id === 'plis-f3080ccd8c34dad70222') {
    return { closures: [{ from: '2026-04-04', until: '2026-04-05', reason: '兒童節及清明節全館休館',
      url: 'https://www.phlib.nat.gov.tw/wSite/ct?ctNode=5239&mp=1&xItem=11299' }] };
  }
  if (library.id === 'plis-9c4e98f5a888073fdc0c') {
    return { closures: [
      ...closureDates(2026, 'https://www.phlib.nat.gov.tw/wSite/ct?ctNode=5239&mp=1&xItem=11355',
        ['10-25'], '光復節休館'),
      { from: '2026-10-27', until: '2026-10-27', reason: '館員選務講習，下午休館',
        time: { start: minutes('13:30'), end: minutes('17:30') },
        url: 'https://www.phlib.nat.gov.tw/wSite/ct?ctNode=5239&mp=1&xItem=11382' },
    ] };
  }
  if (library.id === 'plis-8edd8ad4e311a6907f92') {
    return { closures: [{ from: '2026-02-14', until: '2026-02-19', reason: '春節休館',
      url: 'https://www.phlib.nat.gov.tw/wSite/ct?ctNode=5239&mp=1&xItem=11266' }] };
  }
  if (library.id === 'plis-d31d9ccdab3c7bcf9ff3') {
    const url = 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11075';
    return {
      closures: [
        ...closureDates(2026, url, ['11-02', '11-09', '11-16', '11-23', '11-30'], '週一休館'),
        ...closureDates(2026, url, ['11-28'], '選舉日休館'),
      ],
      checkDates: ['2026-11-27'],
    };
  }
  if (library.id === 'plis-2bbbdcd83068ffcf8f4f') {
    return { closures: [
      { from: '2026-06-26', until: '2026-06-26', time: { start: minutes('12:00'), end: 24 * 60 },
        reason: '12:00 提前閉館', url: 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=10989' },
      { from: '2026-09-01', until: '2026-10-31', reason: '空間改造完工後搬遷休館',
        url: 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11013' },
      ...closureDates(2026, 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=008&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
        ['11-28'], '依館方選舉日休館規定休館'),
    ] };
  }
  if (library.id === 'plis-6f3ad22dfc7825bfbbe5') {
    return { closures: closureDates(2026, 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11036',
      ['08-29'], '環境教育觀摩休館') };
  }
  if (/^新竹市文化局圖書館(?:鹽水分館|動物園分館|金山分館|關東分館|南寮分館|青少年館|香山分館|龍山分館|西門自修室)$/.test(library.name)) {
    return { closures: closureDates(2026, hsinchuCityHours, ['11-28'], '依館方選舉日休館規定休館') };
  }
  if (library.id === 'plis-57c550f79ce262c9b2d6') {
    return { closures: closureDates(2026, 'https://www.tnpl.tn.edu.tw/n15132655629462848525/n1Content',
      ['11-28'], '選舉日休館') };
  }
  const electionClosureRule = electionClosureRules[library.id];
  if (electionClosureRule) {
    return { closures: closureDates(2026, electionClosureRule, ['11-28'], '依館方選舉日休館規定休館') };
  }
  if (['plis-838b908932f56e7b1d22', 'plis-cceeef12e0bfff59593f'].includes(library.id)) {
    return { closures: [{ from: '2026-02-14', until: '2026-02-22', reason: '春節休館',
      url: 'https://www.nankan.gov.tw/chhtml/Detail/2221?mcid=107952' }] };
  }
  if (library.id === 'plis-3762599f4dcfd24804ba') {
    return { closures: [
      { from: '2025-10-06', until: '2026-06-30', reason: '耐震補強工程閉館',
        url: 'https://www.penghu.gov.tw/erdai/home.jsp?act=view&dataserno=202509250001&id=10027' },
      { from: '2026-07-01', until: '2026-08-02', reason: '耐震補強工程延長閉館',
        url: 'https://www.penghu.gov.tw/erdai/home.jsp?act=view&dataserno=202606240012&id=10027' },
      ...closureDates(2026, 'https://www.phlib.nat.gov.tw/wSite/ct?ctNode=5239&idPath=5217_5223_5239&mp=1&xItem=11376',
        ['10-10'], '國慶日休館'),
    ] };
  }
  if (library.id === 'plis-96bdb053d7e967f965dc') {
    const url = 'https://www.fonglin.gov.tw/News_Content.aspx?n=3794&s=199254&sms=9966';
    const ranges = [
      ['02-14', '02-23', '春節'], ['02-27', '03-02', '和平紀念日'], ['04-03', '04-06', '清明節'],
      ['05-01', '05-04', '勞動節'], ['06-19', '06-22', '端午節'], ['09-25', '09-27', '中秋節'],
      ['10-09', '10-12', '國慶日'], ['10-24', '10-26', '光復節'],
    ];
    return {
      calendarYears: [2026],
      closures: [
        ...closureDates(2026, url, ['01-01', '09-28', '12-25'], '國定假日休館'),
        ...ranges.map(([from, until, holiday]) => ({ from: '2026-' + from, until: '2026-' + until, reason: holiday + '休館', url })),
      ],
      checkDates: ['2026-11-28', '2026-12-26', '2026-12-27'],
    };
  }
  if (library.id === 'plis-1d71cbf4cd1d410256ad') {
    return { closures: [{ from: '2026-02-07', until: '2026-10-08', reason: '本館耐震補強閉館，10 月 9 日復館',
      url: 'https://www.ji-an.gov.tw/library/news/v0umkckZlZEA' }] };
  }
  if (library.id === 'plis-c601d6fcc4e455f93f93') {
    return { closures: [{ from: '2026-10-20', until: '2026-12-08',
      reason: '外牆改善工程期間暫停館內服務，還書請使用館外還書箱。預計 12 月 9 日重新開館。',
      url: 'https://library.hccc.gov.tw/ct.asp?ctNode=1051&mp=20&xItem=8738' }] };
  }
  if (library.id === 'plis-b19f4a632868ac1ed335') {
    const url = 'https://lib.bocach.gov.tw/News_Content.aspx?n=887&s=54813&sms=10437';
    return { closures: [
      { from: '2026-11-02', until: '2026-12-15', reason: '館舍整修及圖書盤點期間暫停開放', url },
      { from: '2026-12-16', until: '2026-12-16', time: { start: 0, end: minutes('11:00') },
        reason: '上午 11:00 全面開館', url },
      { from: '2026-03-02', until: '2026-11-01', reason: '空間改善工程期間暫停入館，借還書請洽後門臨時服務台',
        url: 'https://www.chcg.gov.tw/ch2/print_all.aspx?bull_id=426095' },
    ] };
  }
  if (library.id === 'plis-e7aaecf3515c7452935c') {
    return { closures: [
      ...[2026, 2027].flatMap((year) => {
        const dates = Array.from({ length: 12 }, (_, month) => String(month + 1).padStart(2, '0') + '-20')
          .filter((date) => [1, 2, 3, 4, 5].includes(new Date(year + '-' + date + 'T00:00:00Z').getUTCDay()));
        return closureDates(year, chiayiCountyReadingRules, dates, '每月 20 日清館休館');
      }),
      ...closureDates(2026, chiayiCountyReadingRules, ['11-28'], '依館方選舉日休館規定休館'),
    ] };
  }
  if (['plis-1d5bc6bb745d6ead49e9', 'plis-79a601480d722cb58344'].includes(library.id)) {
    return { closures: closureDates(2026, 'https://www.chunan.gov.tw/News_Content.aspx?n=2791&s=1013816',
      ['11-28'], '選舉及公投日休館') };
  }
  if (library.name.startsWith('臺北市立圖書館')) {
    const songshan = library.id === 'plis-b7a50b9284256d36bef0';
    return {
      calendarYears: [2026, 2027],
      closures: [...(taipeiBranchClosures[library.id] ?? []), ...taipei2026, ...taipei2027, ...(songshan ? [2026, 2027].flatMap((year) =>
        monthlyClosures(year, 1, taipeiUrl, '松山分館臨時服務處每月最後一個星期一休館')) : [])],
    };
  }
  if (library.name.startsWith('新北市立圖書館') || library.id === 'plis-461c4b474bd0eb749aaa') {
    const early = newTaipeiElectionEve[library.id];
    const closures = [...(newTaipeiServiceClosures[library.id] ?? []), ...newTaipei2026];
    const mayClosing = newTaipeiMayClosing[library.id];
    if (mayClosing) {
      closures.push(...closureDates(2026, mayClosing.url, ['05-03', '05-10'], '館方公告當日 ' + mayClosing.time + ' 閉館')
        .map((closure) => ({ ...closure, time: { start: minutes(mayClosing.time), end: 24 * 60 } })));
    }
    const inventoryDates = xindianInventoryDates[library.id];
    if (inventoryDates) {
      closures.unshift(...closureDates(2026, 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=52dc595a0d4c4440968dd14d55b7f5c5',
        inventoryDates, '圖書盤點休館'));
    }
    const additional = newTaipeiBranchClosures[library.id];
    if (additional) {
      const branchUrl = 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId='
        + additional.branchId;
      closures.push(...closureDates(2026, branchUrl, additional.dates, '館方行事曆公告休館'));
    }
    if (library.id === 'plis-45e2769173fd5cf565ff') {
      closures.unshift({ from: '2026-10-28', until: '2026-10-30', reason: '空調設備汰換施工休館',
        url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=b85cbfd959194f1db5d4e5ab37ed8248' });
    }
    if (early) {
      closures.push({
        from: '2026-11-27', until: '2026-11-27', time: { start: early.start * 60, end: 24 * 60 },
        reason: '投開票所布置，提前閉館', url: early.url,
      });
    }
    if (library.id === 'plis-f5672c9a38fabba9eabb') closures.push(dongshengClosure);
    if (library.id === 'plis-9de55bfc56b18ae1f99a') {
      closures.push(...closureDates(2026, 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=677c7d169fde41a19734ca3efee0641e',
        ['11-23', '11-24'], '圖書盤點休館'));
    }
    if (library.id === 'plis-e1f47e046250c8795b4f') {
      closures.push(...closureDates(2026, 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=677c7d169fde41a19734ca3efee0641e',
        ['11-27'], '圖書盤點休館'));
    }
    return {
      calendarYears: [2026], closures,
      checkDates: ['2026-01-04', '2026-01-11', '2026-02-21', '2026-05-03', '2026-05-10', '2026-06-25'],
    };
  }
  if (library.id === 'plis-a094b0d4aa7d7722fd03') {
    return { calendarYears: [2026], closures: nationalTaiwan2026, checkDates: ['2026-02-20', '2026-02-21'] };
  }
  if (library.name.startsWith('基隆市公共圖書館')) {
    const main = library.id === 'plis-6c9e30dc1c6abf7a17d4';
    if (main || library.id === 'plis-79f7f1447d98ee4e2917') {
      const trialClosures = main ? [
        { from: '2026-01-01', until: '2026-07-01', reason: '總館整建期間暫停開放',
          url: 'https://kllib.klcg.gov.tw/News_Content.aspx?_CSN=151&n=7789&s=18076&sms=12521' },
        ...closureDates(2026, 'https://kllib.klcg.gov.tw/News_Content.aspx?_CSN=150&n=7789&s=18148&sms=12521',
          ['07-07', '07-08', '07-14', '07-15', '07-21', '07-22', '07-28', '07-29',
            '08-04', '08-05', '08-11', '08-12'], '總館首波試營運僅週四至週日開放'),
      ] : [];
      return { calendarYears: [2026], closures: [...trialClosures, ...keelung2026, {
        from: '2026-08-26', until: '2026-08-26', time: { start: minutes('16:00'), end: 24 * 60 },
        reason: '雞籠中元祭 16:00 提前閉館', url: 'https://kllib.klcg.gov.tw/News_Content.aspx?n=8243&s=18291',
      }] };
    }
    if (library.id === 'plis-d5b8a42994a660f05102') {
      return { calendarYears: [2026], closures: [...keelung2026,
        ...closureDates(2026, 'https://kllib.klcg.gov.tw/Default.aspx', ['05-23'], '仁愛分館停電休館')] };
    }
    return { calendarYears: [2026], closures: keelung2026 };
  }
  if (library.name.startsWith('桃園市立圖書館') && !/兒童(?:玩具|文學)館$/.test(library.name)) {
    return { calendarYears: [2026], closures: taoyuan2026 };
  }
  if (library.name === '高雄市立圖書館') {
    return {
      calendarYears: [2026],
      closures: [{ from: '2026-02-15', until: '2026-02-16', reason: '春節休館', url: kaohsiungUrl }],
      checkDates: [...kaohsiung2026.filter(({ from }) => from !== '2026-02-15').map(({ from }) => from),
        '2026-02-17', '2026-02-18', '2026-02-19'],
    };
  }
  if (kaohsiungStudyRoom(library.id) !== undefined) return { calendarYears: [2026], closures: kaohsiung2026 };
  if (library.id === 'plis-1b4fab4fae6901d46c23') {
    return {
      calendarYears: [2026],
      closures: [...holidays(2026, tainanMainUrl, '02-19', '06-19', '09-25'),
        ...closureDates(2026, tainanMainUrl, ['11-28'], '選舉日休館')],
      checkDates: ['2026-02-20', '2026-02-21'],
    };
  }
  if (['plis-7f6f1af1d74f76b8b82a', 'plis-f763f09459f5d1d5ed4d'].includes(library.id)) {
    const liujia = library.id === 'plis-7f6f1af1d74f76b8b82a';
    const url = liujia ? 'https://www.tnpl.tn.edu.tw/n15587220104535639331/n1Content'
      : 'https://www.tnpl.tn.edu.tw/u5370815395711610155/a1';
    return {
      calendarYears: [2026],
      closures: [
        ...holidays(2026, url, '02-21', '06-19', '09-25'),
        ...closureDates(2026, url, ['01-30', '02-27', '03-27', '04-24', '05-29', '06-26',
          '07-31', '08-28', '10-30', '11-27', ...(!liujia ? ['09-18', '12-18'] : [])], '清潔日休館'),
        ...closureDates(2026, url, ['11-28'], '選舉日休館'),
        ...closureDates(2026, url, liujia ? ['01-31'] : [], '菁埔埤落羽松開幕休館'),
      ],
    };
  }
  if (library.id === 'plis-f69821d5ca7dbea81296') {
    return { closures: closureDates(2026, 'https://tkcc.tnc.gov.tw/ActivityInfoDetailC002100.aspx?Cond=a6b19fec-3a2a-4f47-b4c1-81a93d742595',
      ['11-28'], '選舉日休館') };
  }
  if (library.id === 'plis-f84b77b25e9ffc2013e9') {
    return { closures: [
      { from: '2025-12-01', until: '2026-11-29', reason: '永康區圖書館施工，原館暫停開放',
        url: 'https://lib.tnml.tn.edu.tw/webpac/bulletin_detail.cfm?LibproclaimID=175' },
      { from: '2026-11-30', until: '2027-01-25', reason: '永康區圖書館施工延長，原館暫停開放',
        url: 'https://www.tnpl.tn.edu.tw/n15459485893940237436/n1Content' },
    ] };
  }
  if (library.id === 'plis-898454ce1e74dac77083') {
    const url = 'https://www.tnpl.tn.edu.tw/u4940839700334178966/a1';
    return {
      calendarYears: [2026],
      closures: [
        ...holidays(2026, url, '02-21', '06-19', '09-25').filter(({ from }) => from !== '2026-02-28'),
        ...closureDates(2026, url, ['01-30', '02-27', '03-27', '04-24', '05-29', '06-26',
          '07-31', '08-28', '10-30', '11-27'], '清潔日休館'),
        ...closureDates(2026, url, ['11-28'], '選舉日休館'),
      ],
      checkDates: ['2026-02-28'],
    };
  }
  if (library.id === 'plis-66fa0a939c2eddc2cbeb') {
    return { closures: [
      { from: '2026-03-31', until: '2026-11-16', reason: '鹽水區圖書館原館耐震補強，服務暫移月港里活動中心。',
        url: 'https://www.tnpl.tn.edu.tw/n14985863905827557371/n1Content' },
      { from: '2026-11-17', until: '2026-11-20', reason: '鹽水區圖書館搬遷整理，全館暫停服務。',
        url: 'https://web.tainan.gov.tw/ysdo/News_Content.aspx?n=8385&s=8846323&sms=11449' },
    ] };
  }
}
