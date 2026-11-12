import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { evaluate, validDate } from '../lib/study.ts';
import type { Area, Library, Query } from '../lib/study.ts';
import { branchHours, branchInfo, parseSlots } from '../scripts/taichung-sources.ts';

const area: Area = {
  name: '自習室', kind: 'study', slots: parseSlots('週二至週六 8:30–12:30、13:30–17:30'),
  access: 'walk-in', equipment: { outlet: false, wifi: true }, sources: [],
};
const library: Library = {
  id: 'test', name: '測試館舍', district: '西區', address: '', types: [], sources: [],
  calendarYear: 2026, areas: [area], closures: [],
};
const query: Query = {
  date: '2026-11-12', start: 630, duration: 120, kind: 'study', card: false, registration: false, required: [],
};

test('區間剛好到閉館可用，跨午休或週一無法涵蓋', () => {
  assert.equal(evaluate(library, area, query).status, 'yes');
  assert.equal(evaluate(library, area, { ...query, duration: 121 }).status, 'no');
  assert.equal(evaluate(library, area, { ...query, date: '2026-11-16' }).status, 'no');
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2028-02-29'), true);
});

test('缺少設備資料待確認，已知未提供和不符空間類型可排除', () => {
  assert.equal(evaluate(library, area, { ...query, required: ['laptop'] }).status, 'unknown');
  assert.equal(evaluate(library, area, { ...query, required: ['outlet', 'laptop'] }).status, 'no');
  assert.equal(evaluate(library, area, { ...query, required: ['wifi'] }).status, 'yes');
  assert.equal(evaluate(library, area, { ...query, kind: 'quiet' }).status, 'no');
  assert.equal(evaluate(library, undefined, query).status, 'unknown');
});

test('借閱證和登記資格皆符合才可使用', () => {
  const cardArea = { ...area, access: 'card' as const };
  assert.equal(evaluate(library, cardArea, query).status, 'no');
  assert.equal(evaluate(library, cardArea, { ...query, card: true }).status, 'no');
  assert.equal(evaluate(library, cardArea, { ...query, card: true, registration: true }).status, 'yes');
});

test('休館優先，特殊時段與未核對年度保持待確認', () => {
  const closure = { from: '2026-11-12', until: '2026-11-12', reason: '臨時休館', url: 'https://example.org' };
  assert.equal(evaluate({ ...library, closures: [closure] }, undefined, query).status, 'no');
  assert.equal(evaluate({ ...library, closures: [closure] }, area, { ...query, date: '2026-11-13' }).status, 'yes');
  assert.equal(evaluate({ ...library, checkDates: [query.date] }, area, { ...query, start: 360 }).status, 'unknown');
  assert.equal(evaluate(library, area, { ...query, date: '2027-11-12' }).status, 'unknown');
});

test('解析器保留空間和館舍不同時段，地址以官網欄位為準', () => {
  const markup = '<div class="open_time"><li><span class="time_txt">A棟<br>週二至週日8:30至21:00<br>B棟2F自習室<br>週二至週日8:00至21:00</span></li></div>';
  const hours = branchHours(markup);
  assert.equal(hours.study.length, 6);
  assert.equal(hours.regular[0].start, 510);
  assert.equal(hours.study[0].start, 480);
  assert.equal(branchInfo('<div class="sub_info"><strong>地址：407011臺中市西屯區中科路2201號</strong><strong>自習室座位：32席</strong></div>').address, '臺中市西屯區中科路2201號');
});

test('有明確證據的無自修室可以排除，訪客換證需求保留待確認', () => {
  assert.equal(evaluate({ ...library, studyRoom: false }, undefined, query).status, 'no');
  assert.equal(evaluate({ ...library, studyRoom: true }, undefined, query).status, 'unknown');
  assert.equal(evaluate(library, { ...area, access: 'conditional' }, query).status, 'unknown');
});

test('國圖舊 CSV 的缺字只補對應字元', async () => {
  const { matchesDirectoryText, parseDirectoryEntry } = await import('../scripts/crawl-taichung-directory.ts');
  assert.equal(matchesDirectoryText('臺中市北屯區?子路666號', '臺中市北屯區廍子路666號'), true);
  assert.equal(matchesDirectoryText('臺中市北屯區?子路666號', '臺中市北屯區廍子路667號'), false);
  const entry = parseDirectoryEntry('<ul class="detailed-text"><li><p>中文館名：某國小圖書室</p></li><li><p>有無自修室：無</p></li></ul>',
    'https://libstat.ncl.edu.tw/libraryDataDetail/example', '臺中市北區');
  assert.equal(entry.studyRoom, false);
});

test('公共館開放資料只在新舊地址一致時補上座標', async () => {
  const { applyPublicEvidence } = await import('../scripts/public-library-data.ts');
  const venue = { ...library, address: '臺中市西屯區中科路2201號', sources: [] } as Library;
  const row = { Name: venue.name, Address: '406 臺中市北屯區豐樂路二段158號', TEL: '04-00000000',
    Latitude: '24.1', Longitude: '120.6' };
  applyPublicEvidence(venue, { row, url: 'https://data.gov.tw/dataset/99567' });
  assert.equal(venue.coordinates, undefined);
  row.Address = '407011臺中市西屯區中科路2201號';
  applyPublicEvidence(venue, { row, url: 'https://data.gov.tw/dataset/99567' });
  assert.deepEqual(venue.coordinates, { latitude: 24.1, longitude: 120.6 });
});
