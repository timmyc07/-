import type { Area } from './study.ts';

const citySite = 'https://www.library.taichung.gov.tw/';
const cityRules = citySite + 'form/Details?Parser=2,3,48,28,,,204';
const nlpiRules = 'https://www.nlpi.edu.tw/StandardTemplates/Handlers/FileHandler.ashx?fid=54e87fb9-acf8-4c00-86d7-cfed2e012d35&no=1&sourceType=0&type=FileUpload';

export function pilotVisit(id: string, area: Area) {
  if (id === 'tc-105') {
    const study = area.kind === 'study';
    const laptopArea = area.name.includes('筆電優先使用區');
    return {
      location: study || laptopArea ? 'B 棟 2 樓' : '一般閱覽區，樓層依館方導覽',
      entry: study ? '自由入座，免借閱證及預約。館方可在開館前發號碼牌。'
        : laptopArea ? '筆電區的入座方式待確認，可先電洽館方。' : '自由入座，免借閱證及預約。',
      power: laptopArea ? '筆電優先席的插座待確認。' : '座位不提供充電。',
      links: [['樓層導覽', citySite + 'lib/content/index?Parser=1,105,195'], ['市圖自習區規則', cityRules]],
    };
  }
  if (id === 'tc-123') {
    const study = area.kind === 'study';
    return {
      location: study ? 'B1 自習室' : '1 樓一般閱覽區',
      entry: study ? '一般規則為自由入座。施工期間的 B1 開放情況與專室時段待確認，出發前請電洽。'
        : '自由入座，免借閱證及預約。',
      power: study ? '依市圖自習區規則，座位不提供充電。' : '館方列有筆電席，位置與座位插座待確認。',
      links: [['樓層導覽', citySite + 'lib/content/index?Parser=1,123,375'],
        ['市府修繕進度', 'https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00007']],
    };
  }
  if (id === 'ncl-3aa0574ed94d0f22') {
    const study = area.kind === 'study';
    return {
      location: study ? 'B1 自修閱覽室' : '4、5 樓開放自修的指定閱覽席',
      entry: area.access === 'card'
        ? '帶本人實體國資圖或臺中市圖個人借閱證。可在使用前 1–14 天線上預約，使用日 08:30 前刷證報到。當日可在館內機台登記，取號後 10 分鐘內刷證報到。'
        : study ? '館方公告的自由入座時段，免借閱證及登記。'
          : '自由入座，免借閱證及預約。館藏閱覽優先。',
      power: '自修座位不提供充電。2–5 樓櫃檯旁有臨時充電站，每次以 30 分鐘為原則，充電站無座位。',
      links: [['樓層導覽', 'https://www.nlpi.edu.tw/StaticPage/main-floors'],
        ['服務空間使用須知', nlpiRules], ['充電區規定', 'https://www.nlpi.edu.tw/StaticPage/laptop-charging']],
    };
  }
}
