import type { Area } from './study.ts';

const locations = 'https://www.tnpl.tn.edu.tw/page/EachPavilionList.aspx';
const studyRoomLocations = new Set([
  'plis-27e5ed75c8013b01c228', 'plis-1a144e1832868d76bc0a', 'plis-f84b77b25e9ffc2013e9',
  'plis-f763f09459f5d1d5ed4d', 'plis-518cafd6d62c58eabe4d', 'plis-57c550f79ce262c9b2d6',
  'plis-e1e2bc4b4c8213751baa', 'plis-0c2ace2641b37f2a19ac', 'plis-0cbbf1735c46d0a6488b',
  'plis-524fbb8d8cdb1804a640', 'plis-0dc7812dcf345c815ba1', 'plis-285a909321403c65e3d5',
  'plis-c4b5b81b4108ecfd45e8', 'plis-36df97b4095c8c0d36d7', 'plis-3d795f800ef6fa08fae9',
  'plis-1b4fab4fae6901d46c23', 'plis-c9599dab12b05bf49162',
]);

export function tainanStudyRoom(id: string, area: Area): Area | undefined {
  if (!studyRoomLocations.has(id)) return;
  const sources = [...new Set([...area.sources, locations])];
  if (id === 'plis-c9599dab12b05bf49162') {
    return {
      ...area, name: '2 樓多功能研習教室', access: 'conditional',
      entryNote: '無館方活動時開放自修。每月雙數週的週六原則上供活動使用，實際開放依館方公告。',
      sources: [...sources, 'https://w3fs.tainan.gov.tw/Download.ashx?icon=.pdf&n=5L2z6YeM5Y2A5ZyW5pu46aSo6Ieq5L%2Bu5a6k5L2%2F55So6KaP56%2BELnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNTMvY2tmaWxlL2I2YmYwZWY3LTllYWMtNDk3Ni04NjgwLTFhMTkxYjMwN2YzNS5wZGY%3D'],
    };
  }
  if (id === 'plis-f84b77b25e9ffc2013e9') {
    return {
      ...area, name: '5 樓自修室',
      entryNote: '整修前的館方規定為自由入座，離座以 1 小時為限，筆電須至 1 樓無線上網區使用，自修室插座禁止使用。更新後的規定以復館公告為準。',
      sources: [...sources, 'https://www.tnpl.tn.edu.tw/u5288044517355135248/a1'],
    };
  }
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
