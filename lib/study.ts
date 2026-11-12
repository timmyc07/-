export const facilities = { laptop: '筆電', wifi: 'Wi-Fi', outlet: '座位插座' };
export type Facility = keyof typeof facilities;
export type Slot = { day: number; start: number; end: number };
export type Area = {
  name: string;
  kind: 'study' | 'quiet' | 'reading';
  slots: Slot[] | null;
  access: 'walk-in' | 'card' | 'restricted' | 'conditional' | null;
  reservation?: string;
  seats?: number;
  equipment: Partial<Record<Facility, boolean>>;
  sources: string[];
};
export type Closure = { from: string; until?: string; reason: string; url: string };
export type Library = {
  id: string;
  name: string;
  district: string;
  address: string;
  types: string[];
  sources: string[];
  phone?: string;
  website?: string;
  studyRoom?: boolean;
  directoryStatus?: string;
  accessNote?: string;
  reviewNote?: string;
  ruleLinks?: string[];
  facilities?: string[];
  coordinates?: { latitude: number; longitude: number };
  schedule?: Slot[];
  areas: Area[];
  closures: Closure[];
  calendarYear?: number;
  notices?: string[];
  checkDates?: string[];
};
export type Snapshot = {
  _id: 'taichung';
  importedAt: string;
  sourceCounts: { ncl: number; city: number; branches: number; directoryDetails?: number; publicLibraries?: number; siteChecks?: number };
  issues: string[];
  libraries: Library[];
};
export type Query = {
  date: string;
  start: number;
  duration: number;
  kind: Area['kind'] | '';
  card: boolean;
  registration: boolean;
  required: Facility[];
};
export const kindLabels = { study: '自修室', quiet: '安靜閱覽區', reading: '一般閱覽區' };
export const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
export const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function minutes(time: string) {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function clock(time: number) {
  return [Math.floor(time / 60), time % 60].map((part) => String(part).padStart(2, '0')).join(':');
}

export function validDate(date: string) {
  if (!datePattern.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00Z');
  return Number.isFinite(+parsed) && parsed.toISOString().startsWith(date);
}

export function evaluate(library: Library, area: Area | undefined, query: Query) {
  const missing: string[] = [];
  const failed: string[] = [];
  const closure = library.closures.find(({ from, until }) => from <= query.date && (!until || query.date <= until));
  if (closure) failed.push(closure.reason);
  if (library.calendarYear !== Number(query.date.slice(0, 4))) missing.push('指定日期的休館公告待確認');
  const changed = library.checkDates?.includes(query.date);
  if (changed) missing.push('指定日期有特殊時段或入場方式，請查館方公告');
  if (library.notices?.length) missing.push('有開館異動待核對');
  if (!area && query.kind === 'study' && library.studyRoom === false) failed.push('官方資料標示沒有自修室');
  else if (!area) missing.push('空間規則待確認');
  else {
    if (query.kind && area.kind !== query.kind) failed.push('空間類型不符');
    if (!area.slots) missing.push('空間時段待確認');
    else if (!changed) {
      const day = new Date(query.date + 'T00:00:00Z').getUTCDay();
      if (!area.slots.some((slot) => slot.day === day && slot.start <= query.start &&
        slot.end >= query.start + query.duration)) failed.push('開放時段無法涵蓋整段使用時間');
    }
    if (area.access === null) missing.push('入場資格或預約方式待確認');
    if (area.access === 'conditional') missing.push('依館方規則須符合訪客條件');
    if (area.access === 'restricted') failed.push('限指定身分使用');
    if (!changed && area.access === 'card' && !query.card) failed.push('需持國資圖或臺中市圖個人借閱證');
    if (!changed && area.access === 'card' && !query.registration) failed.push('需預約或現場登記');
    for (const equipment of query.required) {
      const available = area.equipment[equipment];
      if (available === false) failed.push('空間未提供' + facilities[equipment]);
      if (typeof available !== 'boolean') missing.push(facilities[equipment] + '待確認');
    }
  }
  return {
    status: failed.length ? 'no' : missing.length ? 'unknown' : 'yes',
    reasons: [...failed, ...missing],
    closure,
  } as const;
}

export function coverageGaps(library: Library) {
  const gaps: string[] = [];
  if (!library.address) gaps.push('地址');
  if (!library.phone) gaps.push('電話');
  if (!library.website) gaps.push('館方網站');
  if (typeof library.studyRoom !== 'boolean') gaps.push('有無自修室');
  const areas = library.areas.length > 0;
  if (!areas && library.studyRoom === true) gaps.push('自修空間使用規則');
  if (!areas && typeof library.studyRoom !== 'boolean') gaps.push('閱覽空間資料');
  if (areas && !library.calendarYear) gaps.push('年度休館公告');
  for (const area of library.areas) {
    if (!area.slots) gaps.push(area.name + '時段');
    if (!area.access || area.access === 'conditional') gaps.push(area.name + '入場資格');
    for (const key of Object.keys(facilities) as Facility[]) {
      if (typeof area.equipment[key] !== 'boolean') gaps.push(area.name + ' ' + facilities[key]);
    }
  }
  return gaps;
}
