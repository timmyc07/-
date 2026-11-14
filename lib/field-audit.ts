import { clock, coversCalendarYear, weekdays } from './study.ts';
import type { Library, Slot } from './study.ts';

export const fieldLabels = {
  studyRoom: '有無自修室', studyHours: '自修室時段', outlet: '座位插座', calendar2027: '2027 年休館公告',
};
export type AuditField = keyof typeof fieldLabels;
type FieldKey = { libraryId: string; area: string; field: AuditField };
export type FieldReview = FieldKey & { checkedOn: string; value: string | null; note: string; sources: string[] };
export type FieldChange = FieldKey & { libraryName: string; before?: string; after?: string;
  beforeReview?: FieldReview; afterReview?: FieldReview };
export type FieldChangeBatch = { importedAt: string; changes: FieldChange[] };

function key({ libraryId, area, field }: FieldKey) {
  return JSON.stringify([libraryId, area, field]);
}

function formatSlots(slots: Slot[]) {
  const week = weekdays.map((_, day) => slots.filter((slot) => slot.day === day)
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((slot) => clock(slot.start) + '–' + clock(slot.end)).join('、'));
  const groups = new Map<string, string[]>();
  week.forEach((hours, day) => {
    if (hours) groups.set(hours, [...(groups.get(hours) ?? []), weekdays[day]]);
  });
  return [...groups].map(([hours, days]) => '週' + days.join('、') + ' ' + hours).join('；');
}

export function auditRows(libraries: Library[], reviews: FieldReview[] = []) {
  const evidence = new Map(reviews.map((review) => [key(review), review]));
  return libraries.flatMap((library) => {
    const row = (field: AuditField, area: string, value: string | null, sources: string[]) => {
      const id = { libraryId: library.id, area, field };
      const entry = evidence.get(key(id));
      const review = entry?.value === value ? entry : undefined;
      return { ...id, library, value, review, sources: [...new Set(review?.sources ?? sources)] };
    };
    const areas = library.areas.flatMap((area) => {
      const fields = [row('outlet', area.name, area.equipment.outlet === true ? '可充電' :
        area.equipment.outlet === false ? '未提供座位插座' : null, area.sources)];
      if (area.kind === 'study') {
        const hours = area.slots?.length ? formatSlots(area.slots) : null;
        const value = hours && area.slotPeriod ? hours + '（' + area.slotPeriod.from + ' 至 ' + area.slotPeriod.until + '）' : hours;
        fields.unshift(row('studyHours', area.name, value, area.sources));
      }
      return fields;
    });
    if (!library.areas.some((area) => area.kind === 'study') && library.studyRoom === true) {
      areas.unshift(row('studyHours', '', null, library.sources));
    }
    return [
      row('studyRoom', '', library.studyRoom === true ? '有' : library.studyRoom === false ? '無' : null, library.sources),
      row('calendar2027', '', coversCalendarYear(library, 2027) ? '已收錄年度休館表' : null, library.sources),
      ...areas,
    ];
  });
}

export function diffAuditFields(
  before: Library[], after: Library[], beforeReviews?: FieldReview[], afterReviews?: FieldReview[],
): FieldChange[] {
  const old = new Map(auditRows(before, beforeReviews).map((row) => [key(row), row]));
  const changes: FieldChange[] = [];
  const evidence = (review?: FieldReview) => review && JSON.stringify([review.note, [...review.sources].sort()]);
  for (const row of auditRows(after, afterReviews)) {
    const id = key(row);
    const previous = old.get(id);
    old.delete(id);
    if (!previous || previous.value !== row.value || evidence(previous.review) !== evidence(row.review)) {
      changes.push({ libraryId: row.libraryId, libraryName: row.library.name, area: row.area, field: row.field,
        before: previous && (previous.value ?? '待確認'), after: row.value ?? '待確認',
        beforeReview: previous?.review, afterReview: row.review });
    }
  }
  for (const row of old.values()) {
    changes.push({ libraryId: row.libraryId, libraryName: row.library.name, area: row.area, field: row.field,
      before: row.value ?? '待確認', beforeReview: row.review });
  }
  return changes;
}
