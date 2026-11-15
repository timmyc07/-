import type { Library } from './study.ts';

export type LibraryDetail = { url: string; address: string; hours?: string; facilities?: string[] };

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

export function withLibraryDetail<T extends Library>(library: T, detail: LibraryDetail | undefined): T & Library {
  if (!detail?.address || comparableAddress(detail.address) !== comparableAddress(library.address)) return library;
  const local = detail.hours ? undefined : localHours[library.id];
  const studyRoom = local?.studyRoom || detail.facilities?.some((facility) => /^自[修習]室$/.test(facility));
  return {
    ...library,
    openingHours: library.openingHours ?? detail.hours ?? local?.hours,
    facilities: library.facilities ?? detail.facilities,
    studyRoom: library.studyRoom ?? (studyRoom || undefined),
    areas: studyRoom && library.studyRoom !== false && !library.areas.some(({ kind }) => kind === 'study') ? [...library.areas, {
      name: '自修室', kind: 'study', slots: null, access: null, equipment: {},
      sources: [local?.studyRoom ? local.url : detail.url],
    }] : library.areas,
    sources: [...new Set([...library.sources, detail.url, ...(local ? [local.url] : [])])],
  };
}
