import { load } from 'cheerio';
import { minutes, validDate } from '../lib/study.ts';
import type { Area, Closure, Slot } from '../lib/study.ts';

export const citySite = 'https://www.library.taichung.gov.tw/';
export const cityDirectory = 'https://data.gov.tw/dataset/83865';
export const cityHours = citySite + 'content/index?Parser=1,3,72,32';
export const cityRules = citySite + 'form/Details?Parser=2,3,48,28,,,204';
export const cityNotices = citySite + 'latestevent/index?Parser=9,3,41,27';
export const nlpiCalendar = 'https://www.nlpi.edu.tw/ServiceMail/feedback/Holiday';
const nlpiRules = 'https://edu.law.moe.gov.tw/LawContent.aspx?id=GL001461';
const nlpiFloors = 'https://www.nlpi.edu.tw/StaticPage/main-floors';
const nlpiSpaceRules = 'https://www.nlpi.edu.tw/StandardTemplates/Handlers/FileHandler.ashx?fid=54e87fb9-acf8-4c00-86d7-cfed2e012d35&no=1&sourceType=0&type=FileUpload';
export const nlpiArea: Area = {
  name: 'B1 自修閱覽室',
  kind: 'study',
  slots: Array.from({ length: 7 }, (_, day) => ({ day, start: 480, end: day < 2 ? 1020 : 1260 })),
  access: 'card',
  seats: 316,
  reservation: 'https://ispace.nlpi.edu.tw/',
  equipment: { outlet: false, wifi: true },
  sources: [nlpiRules, nlpiFloors, nlpiSpaceRules, 'https://www.nlpi.edu.tw/StaticPage/laptop-charging',
    'https://www.nlpi.edu.tw/StaticPage/internet-access'],
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
  const calendarDates: string[] = [];
  for (const row of $('tr').toArray()) {
    const date = $(row).find('td[data-type="日期："]').text().match(/(\d{3})\/(\d{1,2})\/(\d{1,2})/);
    if (!date) continue;
    const key = dateKey(Number(date[1]) + 1911, date[2], date[3]);
    calendarDates.push(key);
    if (clean($(row).find('td[data-type="休館類型："]').text()) === '全館休館') {
      closures.push({ from: key, until: key, reason: '國資圖全館休館', url: nlpiCalendar });
    }
  }
  const years = new Set(calendarDates.map((date) => Number(date.slice(0, 4))));
  const calendarYear = years.size === 1 ? [...years][0] : year;
  if (!calendarYear || closures.length < 5) throw new Error('國資圖休館日表結構有變動');
  return { year: calendarYear, closures };
}
