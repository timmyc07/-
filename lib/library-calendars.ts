import type { Closure, Library } from './study.ts';

const taipeiUrl = 'https://tpml.gov.taipei/cp.aspx?n=141EFA8D46038957&s=839324A30786DF77';
const newTaipeiUrl = 'https://www.library.ntpc.gov.tw/singlehtml/be937c4bcb74427ca3d3c8fd5b4704b9';
const nationalTaiwanUrl = 'https://www.ntl.edu.tw/wSite/ct?ctNode=1711&mp=1&xItem=58536';
const electionUrl = 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=353f6e7dda484242820ea153ab0eb4a0';

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

function songshanClosures(year: number) {
  const dates = Array.from({ length: 12 }, (_, month) => {
    const last = new Date(Date.UTC(year, month + 1, 0));
    last.setUTCDate(last.getUTCDate() - (last.getUTCDay() + 6) % 7);
    return last.toISOString().slice(5, 10);
  });
  return closureDates(year, taipeiUrl, dates, '松山分館臨時服務處每月最後一個星期一休館');
}

export function libraryCalendar(library: Library): Pick<Library, 'calendarYears' | 'closures' | 'checkDates'> | undefined {
  if (library.name.startsWith('臺北市立圖書館')) {
    const songshan = library.id === 'plis-b7a50b9284256d36bef0';
    return {
      calendarYears: [2026, 2027],
      closures: [...taipei2026, ...taipei2027, ...(songshan ? [...songshanClosures(2026), ...songshanClosures(2027)] : [])],
    };
  }
  if (library.name.startsWith('新北市立圖書館') || library.id === 'plis-461c4b474bd0eb749aaa') {
    return {
      calendarYears: [2026], closures: newTaipei2026,
      checkDates: ['2026-01-04', '2026-01-11', '2026-02-21', '2026-05-03', '2026-05-10', '2026-06-25'],
    };
  }
  if (library.id === 'plis-a094b0d4aa7d7722fd03') {
    return { calendarYears: [2026], closures: nationalTaiwan2026, checkDates: ['2026-02-20', '2026-02-21'] };
  }
}
