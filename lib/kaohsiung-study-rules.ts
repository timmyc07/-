import rooms from './kaohsiung-study-rooms.json' with { type: 'json' };
import type { Area, Slot } from './study.ts';

export const kaohsiungHoursSource = 'https://www.ksml.edu.tw/content/index.aspx?Parser=1,3,45,27';
const rules = 'https://www.ksml.edu.tw/content/index.aspx?Parser=1,8,899,50';
const entries: Record<string, { seats: number; slots: Slot[] } | null | undefined> = rooms;
const publishedRoomNames: Record<string, string | undefined> = {
  'plis-38b264704ba919b0a591': '3 樓自修室',
  'plis-037404bb59864ffe1a19': '自修室及閱報室',
};

export function kaohsiungStudyRoom(id: string): Area | null | undefined {
  const room = entries[id];
  if (!room) return room;
  return {
    ...room,
    name: publishedRoomNames[id] ?? '自修室',
    kind: 'study',
    access: 'walk-in',
    entryNote: '現場入座，館方得於開館前發放號碼牌。',
    equipment: {},
    sources: [kaohsiungHoursSource, rules],
  };
}
