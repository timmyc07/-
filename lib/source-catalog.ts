import { pilotVisit } from './taichung-visits.ts';
import type { Library, Snapshot } from './study.ts';

export function sourcesByHost(libraries: Library[], snapshot: Snapshot | null, onlyHost?: string) {
  const groups = new Map<string, Map<string, string>>();
  const names = new Map(libraries.map(({ id, name }) => [id, name]));

  function add(source: string | undefined, label: string) {
    const url = source && URL.parse(source);
    if (!url || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
    if (onlyHost && url.hostname !== onlyHost) return;
    let links = groups.get(url.hostname);
    if (!links) groups.set(url.hostname, links = new Map());
    if (!links.has(url.href)) links.set(url.href, label);
  }

  for (const library of libraries) {
    add(library.website, library.name + '官網');
    for (const url of library.sources) add(url, library.name + '資料');
    for (const url of library.ruleLinks ?? []) add(url, library.name + '使用規則');
    for (const url of library.notices ?? []) add(url, library.name + '公告');
    for (const closure of library.closures) add(closure.url, closure.reason);
    for (const area of library.areas) {
      const label = library.name + ' · ' + area.name;
      add(area.reservation, label + '預約');
      for (const url of area.sources) add(url, label);
      for (const closure of area.closures ?? []) add(closure.url, closure.reason);
      for (const [title, url] of pilotVisit(library.id, area)?.links ?? []) add(url, library.name + ' · ' + title);
    }
  }

  for (const review of snapshot?.fieldReviews ?? []) {
    for (const url of review.sources) add(url, (names.get(review.libraryId) ?? '臺中館舍') + '逐欄核對');
  }
  for (const batch of snapshot?.fieldHistory ?? []) {
    for (const change of batch.changes) {
      for (const url of change.beforeReview?.sources ?? []) add(url, change.libraryName + '歷次核對');
      for (const url of change.afterReview?.sources ?? []) add(url, change.libraryName + '歷次核對');
    }
  }

  return [...groups].sort(([a], [b]) => a.localeCompare(b));
}
