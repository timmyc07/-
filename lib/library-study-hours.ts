import { minutes, type Slot } from './study.ts';

type WeeklyRange = [days: string, start: string, end: string];
type StudyHours = { name: string; ranges: WeeklyRange[]; url?: string };

const standardTaoyuan: WeeklyRange[] = [['23456', '08:30', '21:00'], ['01', '08:30', '17:00']];
const hsinchuRules = 'https://library.hccg.gov.tw/chhcml/app/data/view?id=18&module=userTerm&serno=b39fff74-7075-46ee-85c5-dee460b6f208';
const hsinchuLate: WeeklyRange[] = [['2345', '09:00', '21:00'], ['06', '09:00', '17:00']];

// 館舍詳情明列的專室時段。各範圍以 0 至 6 代表週日至週六。
const studyHours: Record<string, StudyHours | undefined> = {
  'plis-12cb176cd411e9d41770': {
    name: '自修室', ranges: [['023456', '08:00', '17:00']],
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=012&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-24ed27c19953ccb5f0c4': {
    name: 'C 棟 2 樓自修室', ranges: [['023456', '08:30', '17:00']],
  },
  'plis-703e62be51f0cd3f7e93': {
    name: '3 樓閱覽室', ranges: [['023456', '08:00', '21:00']],
    url: 'https://opendata.miaoli.gov.tw/OpenDataDetail.aspx?n=9404&s=1811',
  },
  'plis-8258ecedb33967785152': {
    name: '自修室', ranges: [['2345', '09:00', '21:00'], ['06', '09:00', '17:00']],
    url: 'https://www.toufen.gov.tw/cp.aspx?n=3043',
  },
  'plis-f3080ccd8c34dad70222': {
    name: '閱覽室（讀者自修室）', ranges: [['12', '08:30', '17:30'], ['03456', '08:30', '21:00']],
    url: 'https://www.phlib.nat.gov.tw/wSite/ct?ctNode=5248&mp=1&xItem=9882',
  },
  'plis-e3c1d8e816d9e6061a7d': {
    name: '南棟 3 樓自修室', ranges: [['023456', '08:00', '21:30']],
    url: 'https://cabkc.kinmen.gov.tw/information?pid=5106&uid=9',
  },
  'plis-8e698a4770cf01e3875e': {
    name: '4 樓自由閱讀區', ranges: [['23456', '08:30', '20:30'], ['0', '08:30', '17:00']],
    url: 'https://www.nthcc.gov.tw/A7_2/content/130',
  },
  'plis-a094b0d4aa7d7722fd03': { name: '自修室', ranges: [['023456', '08:00', '21:00']] },
  'plis-0d8617adcdaa013618d9': {
    name: '7 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/Reader/RegulationContent/20',
  },
  'plis-112e55434de56841e873': {
    name: '5 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/051',
  },
  'plis-8d09da2a8c7fc2f99893': { name: '自修室', ranges: standardTaoyuan },
  'plis-01e95280aebec7eba09c': { name: '自修室', ranges: standardTaoyuan },
  'plis-9c317ee99e20f7ec3cd3': { name: '6 樓自修室', ranges: standardTaoyuan },
  'plis-0670e73215c152add507': {
    name: 'B1 自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/038',
  },
  'plis-dd0e38aa18f750ffcade': { name: 'B1 自修室', ranges: [['123456', '08:30', '21:00'], ['0', '08:30', '17:00']] },
  'plis-07c47313a8f5b473d2bf': {
    name: '3 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/028',
  },
  'plis-79f43b2ba26bb9afade0': { name: '自修室', ranges: standardTaoyuan },
  'plis-99799da6e29815c7da11': { name: '2 樓自修室', ranges: standardTaoyuan },
  'plis-9df366887a25b0673ee7': { name: '多功能研習教室（自修室）', ranges: standardTaoyuan },
  'plis-a38508dd33caf0cfefdc': { name: '自習室', ranges: standardTaoyuan },
  'plis-bb78c5df4d9aa277ab1c': { name: '1 樓自修室', ranges: standardTaoyuan },
  'plis-e94c48945a092b5818d8': { name: '自修室', ranges: [['023456', '08:30', '20:30']] },
  'plis-0d08a9f889b9abeca093': { name: '4 樓自修室', ranges: [['23456', '08:00', '20:00'], ['0', '08:00', '17:00']] },
  'plis-9709456f17abc6c6a512': { name: '自修室', ranges: hsinchuLate, url: hsinchuRules },
  'plis-539f7d3d76b9f2ee658a': { name: '自修室', ranges: hsinchuLate, url: hsinchuRules },
  'plis-5929930cfc61bd687f1f': { name: '西門自修室', ranges: hsinchuLate, url: hsinchuRules },
  'plis-859b54d11aaf9ac7b9be': { name: '自修室', ranges: [['023456', '09:00', '17:00']], url: hsinchuRules },
  'plis-1d5bc6bb745d6ead49e9': {
    name: '3 樓自修室', ranges: [['0123456', '08:00', '18:00']], url: 'https://www.chunan.gov.tw/cp.aspx?n=11120',
  },
  'plis-79a601480d722cb58344': {
    name: '2 樓自修室', ranges: [['0123456', '08:00', '21:00']], url: 'https://www.chunan.gov.tw/cp.aspx?n=4539',
  },
  'plis-b19f4a632868ac1ed335': { name: '3 樓自習室', ranges: [['23456', '08:30', '20:20'], ['0', '08:30', '16:50']] },
  'plis-65e63bfdbf5ce145d999': { name: '3 樓自修室', ranges: [['23456', '09:00', '21:00'], ['0', '09:00', '17:00']] },
  'plis-f935063eced556c94ad8': { name: '自修室', ranges: [['2345', '08:30', '18:50'], ['06', '08:30', '16:50']] },
  'plis-66e53f44f93b7f476b11': { name: '自習室', ranges: [['023456', '08:00', '21:00']] },
  'plis-016c903b9ad9d1b886d6': { name: '讀者自修室', ranges: [['023456', '08:00', '21:00']] },
  'plis-e7aaecf3515c7452935c': { name: '自修室', ranges: [['2345', '08:30', '20:00'], ['06', '08:30', '17:00']] },
  'plis-57c550f79ce262c9b2d6': { name: '自修室', ranges: [['2', '09:00', '17:00'], ['03456', '08:00', '21:00']] },
  'plis-518cafd6d62c58eabe4d': {
    name: '3 樓自修室', ranges: [['2', '09:00', '17:00'], ['03456', '08:00', '21:00']],
    url: 'https://www.tnpl.tn.edu.tw/page/EachPavilionList.aspx',
  },
  'plis-e1e2bc4b4c8213751baa': {
    name: '自修室', ranges: [['2', '09:00', '17:00'], ['03456', '08:00', '21:00']],
    url: 'https://www.tnpl.tn.edu.tw/page/EachPavilionList.aspx',
  },
  'plis-1b4fab4fae6901d46c23': {
    name: 'B1 溫書窩', ranges: [['23456', '08:30', '21:00'], ['0', '08:30', '17:30']],
    url: 'https://www.tnpl.tn.edu.tw/n14721285094990013329/n1Content',
  },
  'plis-421acf277000ebf61419': { name: '自修室', ranges: [['23456', '08:00', '22:00'], ['0', '08:00', '17:00']] },
  'plis-b8bd9cf1d6684cef5d51': { name: '自修室', ranges: [['023456', '09:00', '20:00']] },
  'plis-387900bcde6ccbe06570': { name: '自修室', ranges: [['023456', '08:10', '17:30']] },
  'plis-3dc026b916c043fe287e': {
    name: '1 樓閱覽區（整修期間）', ranges: [['023456', '08:00', '17:00']],
    url: 'https://www.changkang.gov.tw/news/news1/detail/9834',
  },
  'plis-61f904e8f436ea8fc25d': {
    name: '3 樓自修室', ranges: [['1', '17:00', '20:00'], ['2345', '08:00', '20:00'], ['06', '08:00', '17:00']],
    url: 'https://ctrl.chcg.gov.tw/main/main_act3/main.aspx?act_id=45&main_id=3428',
  },
  'plis-3fb94b86e4de966ba65a': {
    name: '自修室', ranges: [['123456', '09:00', '20:00'], ['0', '09:00', '17:00']],
    url: 'https://content.yunlin.gov.tw/cp.aspx?n=994',
  },
  'plis-43bc851b4926b0b037f2': {
    name: '2 樓自修室', ranges: [['023456', '08:30', '17:00']],
    url: 'https://lib.ylccb.gov.tw/wSite/sp?ctNode=6218&mp=1&orgId=019&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-00bd1306ca6884693919': {
    name: '3 樓讀者自修區', ranges: [['23456', '09:00', '20:00'], ['0', '09:00', '17:00']],
    url: 'https://www.chcg.gov.tw/TSO/hemei/07other/main.aspx?main_id=1193',
  },
  'plis-21b90fd0847520bc7c74': {
    name: '4 樓自修區', ranges: [['2345', '08:30', '20:30'], ['06', '08:30', '17:30']],
    url: 'https://www.chcg.gov.tw/TSO/xianxi/07other/main.aspx?main_id=1986',
  },
  'plis-0fbff29cac66fc6527df': {
    name: '自修室', ranges: [['2345', '08:00', '21:00'], ['06', '08:00', '17:00']],
    url: 'https://files.chcg.gov.tw/files/彰化縣社頭鄉立圖書館圖書資料借閱規定(修正)_114_1090214.pdf',
  },
};

export function libraryStudyHours(id: string): { name: string; slots: Slot[]; url?: string } | undefined {
  const hours = studyHours[id];
  if (!hours) return;
  const slots = hours.ranges.flatMap(([days, start, end]) =>
    [...days].map((day) => ({ day: Number(day), start: minutes(start), end: minutes(end) })))
    .sort((first, second) => first.day - second.day || first.start - second.start);
  return { name: hours.name, slots, url: hours.url };
}
