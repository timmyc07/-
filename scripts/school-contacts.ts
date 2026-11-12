import { parse } from 'csv-parse/sync';
import type { Library } from '../lib/study.ts';
import { addressKey } from './public-library-data.ts';
import { clean } from './taichung-sources.ts';

const datasets = [
  [6087, 'https://stats.moe.gov.tw/files/school/115/e1_new.json', 200],
  [6088, 'https://stats.moe.gov.tw/files/opendata/j1_new.json', 70],
  [6089, 'https://stats.moe.gov.tw/files/school/115/high.json', 35],
  [28591, 'https://stats.moe.gov.tw/files/school/115/ac.json', 2],
  [6285, 'https://www.k12ea.gov.tw//files/common_unit/431a1ae5-9503-4675-8e59-07d7286be83f/doc/特殊教育學校名錄.csv', 1],
] as const;

type SchoolRow = {
  學年度?: string | number;
  縣市名稱?: string;
  縣市?: string;
  學校名稱?: string;
  學校?: string;
  地址: string;
  電話: string;
  網址: string;
};
export type SchoolContact = { name: string; address: string; phone: string; website: string; source: string };

export async function schoolContacts(html: (url: string) => Promise<string>) {
  const groups = await Promise.all(datasets.map(async ([id, url, minimum]) => {
    const body = (await html(url)).replace(/^\uFEFF/, '');
    const rows: SchoolRow[] = url.endsWith('.csv')
      ? parse(body, { columns: true, skip_empty_lines: true })
      : JSON.parse(body);
    const local = rows.filter((row) => (row.學年度 === undefined || Number(row.學年度) === 115) &&
      clean(row.縣市名稱 ?? row.縣市 ?? '').endsWith('臺中市'));
    if (local.length < minimum) throw new Error('教育部學校名錄臺中筆數異常：' + id);
    return local.map((row): SchoolContact => ({
      name: row.學校名稱 ?? row.學校 ?? '', address: row.地址, phone: clean(row.電話),
      website: clean(row.網址), source: 'https://data.gov.tw/dataset/' + id,
    }));
  }));
  return groups.flat();
}

function schoolName(name: string) {
  return clean(name).replace(/^(?:臺中市立|臺中市(?:[^區]+區)?|市立)/, '')
    .replace(/(?:國民小學|國民中學|高級中學)/g, (label) =>
      label === '國民小學' ? '國小' : label === '國民中學' ? '國中' : '高中')
    .replace(/暨附設國中部/, '').replace(/國小部/, '國小')
    .replace(/(?:傳枝圖書館|資源中心圖書室|晨悅圖書館|社區共讀站|書海藝游|光之圖|圖書[館室])$/, '');
}

function schoolAddress(address: string) {
  return addressKey(address.replace(/^\[\d+\]/, ''))
    .replace(/^(.*?區)[^區里]{1,4}里(?:\d+鄰)?/, '$1')
    .replace(/號(?:教務處|西屯校區)$/, '號');
}

export function matchSchoolContact(library: Library, schools: SchoolContact[]) {
  if (!library.types.some((type) => /^(?:國民[中小]學|高級中等學校)圖書館$/.test(type))) return;
  const name = schoolName(library.name);
  const address = schoolAddress(library.address);
  const matches = schools.filter((school) => schoolName(school.name) === name && schoolAddress(school.address) === address);
  if (matches.length === 1) return matches[0];
}

export function applySchoolContact(library: Library, schools: SchoolContact[]) {
  if (library.phone && library.website) return;
  const contact = matchSchoolContact(library, schools);
  if (!contact) return;
  const { phone, website, source } = contact;
  const href = /^https?:\/\//.test(website) ? website : 'https://' + website;
  const addPhone = !library.phone && /^(?:\(04\)|04[- ]?)\s*\d{4}-?\d{4}/.test(phone);
  const addWebsite = !library.website && URL.canParse(href) && /\.edu\.tw$/.test(new URL(href).hostname);
  if (addPhone) library.phone = phone;
  if (addWebsite) library.website = href;
  if (addPhone || addWebsite) library.sources.push(source);
}
