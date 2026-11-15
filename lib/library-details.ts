import type { Area, Library } from './study.ts';
import { libraryStudyHours } from './library-study-hours.ts';
import { libraryCalendar } from './library-calendars.ts';
import { taipeiStudyRoom } from './taipei-study-rules.ts';

export type LibraryDetail = { url: string; address: string; hours?: string; facilities?: string[] };

const buildingClosures: Record<string, Library['closures'][number] | undefined> = {
  'plis-eb5cc227330385ea9b00': {
    from: '2026-03-02', reason: '自 2026 年 3 月 2 日起閉館施工，復館日期以館方公告為準。',
    url: 'https://www.cna.com.tw/postwrite/chi/425420',
  },
  'plis-79f43b2ba26bb9afade0': {
    from: '2026-01-01', reason: '崎頂分館自 2026 年 1 月 1 日起因搬遷至埔頂分館停止開放。',
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/02',
  },
};

const localHours: Record<string, { url: string; hours: string; studyRoom?: true } | undefined> = {
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

const comparableAddress = (value: string) => value.normalize('NFKC').replaceAll('台', '臺')
  .trim().replace(/^\d{3,6}(?=\s*\D)/, '').replace(/\s/g, '');

const faxLocation = (value: string) => comparableAddress(value).replace(/-(?=\d)/g, '之');
const taichungFaxName = (value: string) => value.normalize('NFKC').replace(/\s/g, '')
  .replace(/^臺中市立圖書館/, '').replace(/(?:國立公共資訊圖書館精武分館|^精武圖書館$)/, '精武圖書館');

export function withTaichungFax(library: Library, directory: Library[]): Library {
  if (library.fax) return library;
  const name = taichungFaxName(library.name);
  const address = faxLocation(library.address);
  const [match, duplicate] = directory.filter((candidate) =>
    taichungFaxName(candidate.name) === name && faxLocation(candidate.address) === address);
  if (!match?.fax || duplicate || !address) return library;
  return { ...library, fax: match.fax, sources: [...new Set([...library.sources, ...match.sources])] };
}

export function withLibraryDetail<T extends Library>(library: T, detail: LibraryDetail | undefined): T & Library {
  if (!detail?.address || comparableAddress(detail.address) !== comparableAddress(library.address)) return library;
  const local = detail.hours ? undefined : localHours[library.id];
  const closure = buildingClosures[library.id];
  const study = detail.hours ? libraryStudyHours(library.id) : undefined;
  const listed = Boolean(detail.facilities?.some((facility) => /^自[修習]室$/.test(facility)));
  const area: Area = {
    name: study?.name ?? '自修室', kind: 'study', slots: study?.slots ?? null, access: null, equipment: {},
    sources: [study?.url ?? (local?.studyRoom ? local.url : detail.url)],
  };
  const taipeiArea = taipeiStudyRoom(library, area, listed);
  const localArea = localStudyRoom(library.id, taipeiArea ?? area);
  const studyRoom = Boolean(study || local?.studyRoom || listed || taipeiArea);
  const calendar = libraryCalendar(library);
  return {
    ...library,
    openingHours: closure?.reason ?? library.openingHours ?? detail.hours ?? local?.hours,
    calendarYears: calendar?.calendarYears ?? library.calendarYears,
    checkDates: calendar?.checkDates ? [...new Set([...(library.checkDates ?? []), ...calendar.checkDates])] : library.checkDates,
    closures: [...library.closures, ...(calendar?.closures ?? []), ...(closure ? [closure] : [])],
    facilities: library.facilities ?? detail.facilities,
    studyRoom: library.studyRoom ?? (studyRoom || undefined),
    areas: studyRoom && library.studyRoom !== false && !library.areas.some(({ kind }) => kind === 'study')
      ? [...library.areas, localArea] : library.areas,
    sources: [...new Set([...library.sources, detail.url, ...(local ? [local.url] : []),
      ...(calendar?.closures.map(({ url }) => url) ?? []), ...(closure ? [closure.url] : [])])],
  };
}

function localStudyRoom(id: string, area: Area): Area {
  if (id === 'plis-6c9e30dc1c6abf7a17d4') {
    return {
      ...area, access: 'card', regionalCard: 'keelung', seats: 109,
      entryNote: '持基隆市圖個人借閱證，線上預約或到館登記。每次原則為 1–3 小時，現場零星時段至少 30 分鐘。',
      reservation: 'https://ireserve.klccab.gov.tw/',
      sources: [...area.sources, 'https://kllib.klcg.gov.tw/cp.aspx?n=9043',
        'https://kllib.klcg.gov.tw/News_Content.aspx?_CSN=150&n=7789&s=18148&sms=12521'],
    };
  }
  const dayuan = id === 'plis-9c317ee99e20f7ec3cd3';
  if (dayuan || id === 'plis-0d8617adcdaa013618d9') {
    return {
      ...area, access: 'card', regionalCard: 'taoyuan', seats: dayuan ? 147 : undefined,
      entryNote: '持桃園市圖個人借閱證（含行動借閱證）或市民卡，線上預約或到館登記。',
      reservation: 'https://spaceme.typl.gov.tw/',
      sources: [...area.sources, 'https://www.typl.gov.tw/zh-tw/Reader/RegulationContent/6',
        dayuan ? 'https://www.typl.gov.tw/zh-tw/About/Introduce/014' : 'https://www.typl.gov.tw/zh-tw/About/Introduce/35'],
    };
  }
  return area;
}
