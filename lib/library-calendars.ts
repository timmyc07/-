import { minutes, type Closure, type Library } from './study.ts';
import { kaohsiungStudyRoom } from './kaohsiung-study-rules.ts';

const taipeiUrl = 'https://tpml.gov.taipei/cp.aspx?n=141EFA8D46038957&s=839324A30786DF77';
const newTaipeiUrl = 'https://www.library.ntpc.gov.tw/singlehtml/be937c4bcb74427ca3d3c8fd5b4704b9';
const nationalTaiwanUrl = 'https://www.ntl.edu.tw/wSite/ct?ctNode=1711&mp=1&xItem=58536';
const electionUrl = 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=353f6e7dda484242820ea153ab0eb4a0';
const newTaipeiElectionEve: Record<string, { start: number; url: string } | undefined> = {
  'plis-a2efc5dfbc94ad322d3d': { start: 12, url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=029589630b684964945529418472ef30' },
  'plis-b9568520f14810d9931a': { start: 12, url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=cc172c75856b4421bcfb3a655534abaf' },
  'plis-4b5e39e13cd44319599f': { start: 13, url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=4ded2dc334a04c0cb6e638e839b18870' },
};
const dongshengClosure: Closure = {
  from: '2026-12-01', reason: '樹林東昇分館因都更閉館，臨時服務據點設於樹林區客家藝文館（中洲街 5-2 號）。',
  url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=90269135cd3b46ccac221df193f78e60',
};
const keelungUrl = 'https://kllib.klcg.gov.tw/News_Content.aspx?n=7789&s=16436&sms=12521';
const taoyuanUrl = 'https://www.typl.gov.tw/zh-tw/News/Content/1067';
const kaohsiungUrl = 'https://www.ksml.edu.tw/LibNews/Details.aspx?Parser=9,4,33,,,,15495';
const tainanMainUrl = 'https://www.tnpl.tn.edu.tw/u4914263388070917076/a1';
const electionClosureRules: Record<string, string> = {
  'plis-e94c48945a092b5818d8': 'https://www.hchcc.gov.tw/Tw/Common/SinglePage?filter=55A4FB62-998F-4818-BDE2-08AF8B3245C2',
  'plis-24ed27c19953ccb5f0c4': 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=004&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-bda0333882d76e416b20': 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=009&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  'plis-645a77676fc64f962dcf': 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000306',
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
  ...closureDates(2026, taoyuanUrl, ['01-29', '02-26', '03-26', '04-30', '05-28', '06-25', '07-30', '08-27', '09-24', '10-29', '11-26', '12-31'], '圖書整理清館日休館'),
  ...closureDates(2026, 'https://www.typl.gov.tw/zh-tw/Closed/Content/90', ['11-28'], '選舉日休館'),
];
const kaohsiung2026 = [
  ...holidays(2026, kaohsiungUrl, '02-19', '06-19', '09-25'),
  ...closureDates(2026, kaohsiungUrl, ['04-06', '10-26'], '補假日休館'),
  ...closureDates(2026, kaohsiungUrl, ['11-28'], '選舉日休館'),
];

function songshanClosures(year: number) {
  const dates = Array.from({ length: 12 }, (_, month) => {
    const last = new Date(Date.UTC(year, month + 1, 0));
    last.setUTCDate(last.getUTCDate() - (last.getUTCDay() + 6) % 7);
    return last.toISOString().slice(5, 10);
  });
  return closureDates(year, taipeiUrl, dates, '松山分館臨時服務處每月最後一個星期一休館');
}

export function libraryCalendar(library: Library): Pick<Library, 'calendarYears' | 'closures' | 'checkDates'> | undefined {
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
    return { closures: [{ from: '2026-10-20', until: '2026-12-08', reason: '外牆改善工程暫停服務，預計 12 月 9 日重新開館',
      url: 'https://library.hccc.gov.tw/ct.asp?ctNode=925&mp=20&xItem=8738' }] };
  }
  if (library.id === 'plis-b19f4a632868ac1ed335') {
    const url = 'https://lib.bocach.gov.tw/News_Content.aspx?n=887&s=54813&sms=10437';
    return { closures: [
      { from: '2026-11-02', until: '2026-12-15', reason: '館舍整修及圖書盤點期間暫停開放', url },
      { from: '2026-12-16', until: '2026-12-16', time: { start: 0, end: minutes('11:00') },
        reason: '上午 11:00 全面開館', url },
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
      closures: [...taipei2026, ...taipei2027, ...(songshan ? [...songshanClosures(2026), ...songshanClosures(2027)] : [])],
    };
  }
  if (library.name.startsWith('新北市立圖書館') || library.id === 'plis-461c4b474bd0eb749aaa') {
    const early = newTaipeiElectionEve[library.id];
    const closures = [...newTaipei2026];
    if (early) {
      closures.push({
        from: '2026-11-27', until: '2026-11-27', time: { start: early.start * 60, end: 24 * 60 },
        reason: '投開票所布置，提前閉館', url: early.url,
      });
    }
    if (library.id === 'plis-f5672c9a38fabba9eabb') closures.push(dongshengClosure);
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
