import { load } from 'cheerio';
import { minutes, validDate } from '../lib/study.ts';
import type { Area, Closure, Slot } from '../lib/study.ts';

export const citySite = 'https://www.library.taichung.gov.tw/';
export const cityDirectory = 'https://data.gov.tw/dataset/83865';
export const cityHours = citySite + 'content/index?Parser=1,3,72,32';
export const cityRules = citySite + 'form/Details?Parser=2,3,48,28,,,204';
export const cityNotices = citySite + 'latestevent/index?Parser=9,3,41,27';
export const nlpiCalendar = 'https://www.nlpi.edu.tw/ServiceMail/feedback/Holiday';
export const nlpiRules = 'https://edu.law.moe.gov.tw/LawContent.aspx?id=GL001461';
const cityBavi = 'https://www.taichung.gov.tw/8868/8872/9962/3318680';
const nlpiBavi = 'https://www.nlpi.edu.tw/Announcement/news?PageType=1&id=205b2032-71c9-4840-941e-837716577c68';
const baviClosures: Closure[] = [
  { from: '2026-07-10', until: '2026-07-10', time: { start: 1080, end: 1440 }, reason: '巴威颱風 18:00 起休館', url: cityBavi },
  { from: '2026-07-11', until: '2026-07-11', reason: '巴威颱風休館', url: cityBavi },
];
export const cityWeatherClosures: Closure[] = [
  ...baviClosures,
  { from: '2026-10-23', until: '2026-10-23', reason: '薔琵颱風休館', url: 'https://www.dongshi.taichung.gov.tw/982800/982803/982806/4081754' },
  { from: '2026-10-24', until: '2026-10-24', reason: '薔琵颱風休館', url: citySite + 'latestevent/Details?Parser=9,3,38,27,,,1952' },
];
export const nlpiWeatherClosures: Closure[] = [
  ...baviClosures.map((closure) => ({ ...closure, url: nlpiBavi })),
  { from: '2026-10-23', until: '2026-10-23', reason: '薔琵颱風休館',
    url: 'https://www.nlpi.edu.tw/Announcement/news?ID=019d4936-689f-4658-be20-b8ef1d9bb95a&PageType=1' },
  { from: '2026-10-24', until: '2026-10-24', reason: '薔琵颱風休館',
    url: 'https://www.nlpi.edu.tw/Announcement/news?PageType=1&id=45949f40-f507-436f-8e32-b85545c48f28' },
];
const nlpiFloors = 'https://www.nlpi.edu.tw/StaticPage/main-floors';
const nlpiSpaceRules = 'https://www.nlpi.edu.tw/FileList/government-information?ID=2e0befc6-8fcb-487f-807b-e7f97f01366c&PageIndex=1&PageType=1&SubCategoryID=cdc75d0c-75a2-44af-8384-34df9a39d262';
const nlpiWifi = 'https://www.nlpi.edu.tw/StaticPage/internet-access';
const nlpiSpaceMaintenance = 'https://www.nlpi.edu.tw/Announcement/news?PageType=1&id=7a11da3b-2a48-4fa9-8e60-0968fd2c9d3d&pageIndex=1';
const nlpiNovemberMaintenance = 'https://www.nlpi.edu.tw/uploadplugin/getFile?Caption=1109%E5%85%AC%E5%91%8A.jpg&file=1M%2BSg%2Bka6ovENNjFZWbLnxXOPgLQ%2FVSwn0ml%2BLb4hd8Dyxmj0WnysiJAadiGyjbj';
export const nlpiArea: Area = {
  name: 'B1 自修閱覽室',
  kind: 'study',
  slots: Array.from({ length: 7 }, (_, day) => ({ day, start: 480, end: day < 2 ? 1020 : 1260 })),
  access: 'card',
  walkInDates: ['2026-10-12', { date: '2026-11-09', start: minutes('09:30'), end: minutes('12:30') }],
  seats: 316,
  reservation: 'https://ispace.nlpi.edu.tw/',
  equipment: { outlet: false, wifi: true },
  sources: [nlpiRules, nlpiFloors, nlpiSpaceRules, nlpiSpaceMaintenance, nlpiNovemberMaintenance,
    'https://ispace.nlpi.edu.tw/#/rules/8a8a99e57bc9e858017bcb1a9b4a0001',
    'https://www.nlpi.edu.tw/StaticPage/laptop-charging',
    nlpiWifi],
};

export const nlpiQuietArea: Area = {
  name: '4、5 樓開放自修的閱覽席',
  kind: 'quiet',
  slots: [0, 2, 3, 4, 5, 6].map((day) => ({
    day, start: minutes('09:00'), end: minutes(day === 0 ? '16:30' : '20:30'),
  })),
  access: 'walk-in',
  equipment: { outlet: false, wifi: true },
  sources: [nlpiRules, nlpiFloors, nlpiSpaceRules, nlpiWifi,
    'https://www.nlpi.edu.tw/Faq/help-faq?ID=a2bcf4e2-82a5-4850-81eb-bf9b7936a9e8&PageIndex=7&PageType=1',
    'https://www.nlpi.edu.tw/Faq/help-faq?ID=18d0302c-af8b-4b50-a44e-4c98a235357c&PageIndex=12&PageType=1'],
};

export function clean(text: string) {
  return text.normalize('NFKC').replaceAll('台', '臺').replace(/\s+/g, ' ').trim();
}

export function branchName(text: string) {
  const name = clean(text).replace(/^臺中市立圖書館/, '').replace(/[() ]/g, '');
  if (name === '東勢分館') return '東勢許良宇圖書館';
  if (name === '國立公共資訊圖書館精武分館' ||
      (name.includes('精武分館') && name.includes('臺中市立圖書館營運'))) return '精武圖書館';
  return name;
}

const weekdayNumber = '日一二三四五六';
const clockRange = '(\\d{1,2}:[0-5]\\d)(?:至|[-~–—～－])(\\d{1,2}:[0-5]\\d)';

export function parseSlots(text: string): Slot[] {
  const rules = /(?:週|星期)([日一二三四五六])(?:至(?:週|星期)?([日一二三四五六]))?[:：]?\s*((?:\d{1,2}:[0-5]\d(?:至|[-~–—～－])\d{1,2}:[0-5]\d[、,;]?)+)/g;
  const slots: Slot[] = [];
  for (const [, first, last, ranges] of clean(text).replace(/\s+/g, '').matchAll(rules)) {
    const startDay = weekdayNumber.indexOf(first);
    const endDay = weekdayNumber.indexOf(last ?? first);
    for (const [, from, to] of ranges.matchAll(new RegExp(clockRange, 'g'))) {
      const start = minutes(from);
      const end = minutes(to);
      if (start >= end || end > 1440) throw new Error('無效的館方時間區間');
      const span = (endDay - startDay + 7) % 7;
      for (let offset = 0; offset <= span; offset++) slots.push({ day: (startDay + offset) % 7, start, end });
    }
  }
  return slots.sort((a, b) => a.day - b.day || a.start - b.start);
}

export function branchHours(html: string) {
  const $ = load(html);
  const block = $('.open_time li .time_txt').first();
  block.find('br').replaceWith('\n');
  return roomHours(block.text());
}

export function roomHours(text: string) {
  const named = /([^\n]*(?:自習室|自修室)[^\n]*)\n([\s\S]*)/.exec(text);
  if (named) {
    return { regular: parseSlots(text.slice(0, named.index)), study: parseSlots(named[2]), label: clean(named[1]) };
  }
  return { regular: parseSlots(text), study: [], label: '' };
}

export function branchInfo(html: string) {
  const $ = load(html);
  const fields = $('.sub_info strong').toArray().map((field) => clean($(field).text()));
  const field = (name: string) => fields.find((value) => value.startsWith(name + ':'))?.slice(name.length + 1).trim();
  const address = field('地址')?.replace(/^\d{3,6}\s*/, '').replace(/^(?=[^臺]*區)/, '臺中市');
  const phone = field('電話')?.match(/(?:\(04\)|04[- ])\s*\d{4}-?\d{3,4}/)?.[0];
  const buildingAddresses = [...(field('地址') ?? '').matchAll(/([A-Z])棟-?\s*\d{3,6}\s*(臺中市.*?號)(?=\s|$)/g)]
    .map(([, building, value]) => ({ building, address: value,
      phone: (field('電話') ?? '').split(building + '棟')[1]?.match(/^\s*(\(04\)\s*\d{4}-?\d{4})/)?.[1],
    }));
  const listed = field('服務設施') ?? '';
  const studySeats = field('自習室座位') ?? '';
  const readingSeats = field('一般閱覽席位') ?? '';
  const seats = (value: string) => Number(value.replace(/,/g, '').match(/^\d+/)?.[0]) || undefined;
  return {
    address: address?.startsWith('臺中市') ? address : undefined,
    phone, buildingAddresses,
    study: /自[修習]室/.test(listed) || Boolean(seats(studySeats)),
    noStudy: /^(?:無|0席?)$/.test(studySeats),
    studySeats: seats(studySeats),
    readingSeats: seats(readingSeats),
  };
}

export function dateKey(year: number, month: string, day: string) {
  const date = [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  if (!validDate(date)) throw new Error('無效的館方公告日期');
  return date;
}

export function cityCalendar(html: string) {
  const $ = load(html);
  const table = $('table').filter((_, item) => /休館日一覽表/.test($(item).find('caption').text())).first();
  const year = Number(table.find('caption').text().match(/(20\d{2})年/)?.[1]);
  const holidays = table.find('tbody tr').toArray().flatMap((row) => {
    const [date, reason, note] = $(row).find('td').toArray().map((cell) => clean($(cell).text()));
    const match = date?.match(/^(\d+)月(\d+)日/);
    return match ? [{ date: dateKey(year, match[1], match[2]), reason, note }] : [];
  });
  if (!year || holidays.length < 10) throw new Error('臺中市圖休館日表結構有變動');
  return { year, holidays };
}

export function nationalCalendar(html: string) {
  const $ = load(html);
  const year = Number($('select option[selected]').toArray()
    .map((option) => $(option).text().trim()).find((option) => /^20\d{2}$/.test(option)));
  const closures: Closure[] = [];
  const limingClosures: Closure[] = [];
  const adjustedDates: string[] = [];
  const calendarDates: string[] = [];
  for (const row of $('tr').toArray()) {
    const date = $(row).find('td[data-type="日期："]').text().match(/(\d{3})\/(\d{1,2})\/(\d{1,2})/);
    if (!date) continue;
    const key = dateKey(Number(date[1]) + 1911, date[2], date[3]);
    calendarDates.push(key);
    const change = clean($(row).find('td[data-type="休館類型："]').text());
    if (change === '調整開館') adjustedDates.push(key);
    if (change === '全館休館') {
      const occasion = clean($(row).find('td[data-type="節日名稱："]').text());
      const note = clean($(row).find('td[data-type="說明："]').text());
      const mainOnly = occasion.includes('總館休館') || /黎明分館[^。]*照常開放/.test(note);
      const closure = { from: key, until: key, reason: mainOnly ? occasion || '國資圖總館休館' : '國資圖全館休館',
        url: nlpiCalendar };
      closures.push(closure);
      if (!mainOnly) limingClosures.push(closure);
    }
  }
  const years = new Set(calendarDates.map((date) => Number(date.slice(0, 4))));
  const calendarYear = years.size === 1 ? [...years][0] : year;
  if (!calendarYear || closures.length < 5) throw new Error('國資圖休館日表結構有變動');
  return { year: calendarYear, closures, limingClosures, adjustedDates };
}
