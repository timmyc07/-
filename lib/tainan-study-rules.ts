import type { Area } from './study.ts';

const locations = 'https://www.tnpl.tn.edu.tw/page/EachPavilionList.aspx';
const studyRoomLocations = new Set([
  'plis-27e5ed75c8013b01c228', 'plis-1a144e1832868d76bc0a', 'plis-f84b77b25e9ffc2013e9',
  'plis-f763f09459f5d1d5ed4d', 'plis-518cafd6d62c58eabe4d', 'plis-57c550f79ce262c9b2d6',
  'plis-e1e2bc4b4c8213751baa', 'plis-0c2ace2641b37f2a19ac', 'plis-0cbbf1735c46d0a6488b',
  'plis-524fbb8d8cdb1804a640', 'plis-0dc7812dcf345c815ba1', 'plis-285a909321403c65e3d5',
  'plis-c4b5b81b4108ecfd45e8', 'plis-36df97b4095c8c0d36d7', 'plis-3d795f800ef6fa08fae9',
  'plis-1b4fab4fae6901d46c23',
]);

export function tainanStudyRoom(id: string, area: Area): Area | undefined {
  if (!studyRoomLocations.has(id)) return;
  const sources = [...new Set([...area.sources, locations])];
  if (id === 'plis-1b4fab4fae6901d46c23') {
    return {
      ...area, access: 'card', regionalCard: 'tainan', seats: 130, equipment: { laptop: false },
      entryNote: '持臺南市公共圖書館借閱證。100 席供線上預約、30 席供現場登記，開始後 20 分鐘內刷證報到。',
      reservation: 'https://ireserve.tnml.tn.edu.tw/',
      sources,
    };
  }
  if (id === 'plis-57c550f79ce262c9b2d6') {
    return {
      ...area, access: 'walk-in', entryNote: '自由入座，離座逾 30 分鐘館方得清空座位。',
      sources: [...sources, 'https://www.tnpl.tn.edu.tw/u5707633211863852557/a1'],
    };
  }
  return { ...area, sources };
}
