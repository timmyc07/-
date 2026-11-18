import { minutes, timePattern, validDate } from './study.ts';

export const normalizeSearchText = (value: string) => value.trim().normalize('NFKC').replaceAll('台', '臺');

export function requestedPage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function searchRegion(regions: Record<string, string[]>, cityInput = '', districtInput = '') {
  const requestedCity = normalizeSearchText(cityInput);
  const requestedDistrict = normalizeSearchText(districtInput);
  const city = Object.keys(regions).find((name) => normalizeSearchText(name) === requestedCity) ?? '';
  const district = city ? regions[city].find((name) => normalizeSearchText(name) === requestedDistrict) ?? '' : '';
  return { city, district, invalidRegion: Boolean((requestedCity && !city) || (requestedDistrict && !district)) };
}

export function searchTime(today: string, date = today, start = '14:00', durationText = '120') {
  const duration = Number(durationText);
  const startMinute = minutes(start);
  const validDay = !date.startsWith('0000-') && validDate(date);
  const validStart = timePattern.test(start);
  const validDuration = Number.isInteger(duration) && duration >= 1;
  const invalidTime = !validDay || !validStart || !validDuration || startMinute + duration > 1440;
  const formStart = validStart ? start : '14:00';
  const remaining = 1440 - minutes(formStart);
  return {
    date, startMinute, duration, invalidTime,
    changed: date !== today || start !== '14:00' || duration !== 120 || invalidTime,
    formDate: validDay ? date : today,
    formStart,
    formDuration: validDuration && duration <= remaining ? duration : Math.min(120, remaining),
  };
}
