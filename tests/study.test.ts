import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { coverageGaps, evaluate, isPublicLibrary, validDate } from '../lib/study.ts';
import type { Area, Library, Query } from '../lib/study.ts';
import { branchHours, branchInfo, branchName, nationalCalendar, parseSlots } from '../scripts/taichung-sources.ts';

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

test('公立館清單排除學校、私立、混合館別及未分類館舍', () => {
  const publicLibrary = { ...library, types: ['公共圖書館'] };
  const venues = [publicLibrary, { ...library, types: ['國中圖書館'] },
    { ...library, types: ['高中圖書館'] }, { ...library, types: ['大專校院圖書館'] },
    { ...library, types: ['私立圖書館'] }, { ...library, types: ['公共圖書館', '高中圖書館'] }, library];
  assert.deepEqual(venues.filter(isPublicLibrary), [publicLibrary]);
});

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

test('分段休館只排除與公告時段重疊的查詢', () => {
  const closure = { from: query.date, until: query.date, time: { start: 660, end: 690 },
    reason: '臨時休館', url: 'https://example.org' };
  const venue = { ...library, closures: [closure] };
  assert.equal(evaluate(venue, area, { ...query, duration: 30 }).status, 'yes');
  assert.equal(evaluate(venue, area, { ...query, duration: 31 }).status, 'no');
  assert.equal(evaluate(venue, area, { ...query, start: 690, duration: 30 }).status, 'yes');
  assert.equal(evaluate(venue, area, { ...query, date: '2026-11-13' }).status, 'yes');
});

test('重開館後的休館日曆只適用於生效日起', () => {
  const venue = { ...library, calendarFrom: '2026-11-13' };
  assert.equal(evaluate(venue, area, query).status, 'unknown');
  assert.equal(evaluate(venue, area, { ...query, date: '2026-11-13' }).status, 'yes');
});

test('國資圖日曆區分總館休館與所有分館同時休館', () => {
  const row = (day: number, name: string, note = '') => `<tr>
    <td data-type="日期：">115/06/${day}</td><td data-type="休館類型：">全館休館</td>
    <td data-type="節日名稱：">${name}</td><td data-type="說明：">${note}</td>
  </tr>`;
  const calendar = nationalCalendar('<table>' + [
    row(17, '冷氣工程總館休館'), row(18, '冷氣工程', '黎明分館及中興分館照常開放。'),
    row(19, '端午節'), row(20, '全館整修'), row(21, '全館維護'),
  ].join('') + '</table>');
  assert.deepEqual(calendar.closures.map((day) => day.from), ['17', '18', '19', '20', '21'].map((day) => '2026-06-' + day));
  assert.deepEqual(calendar.limingClosures.map((day) => day.from), ['2026-06-19', '2026-06-20', '2026-06-21']);
});

test('部分開館時只顯示開放區域與該區可確認的設備', () => {
  const reading: Area = { ...area, name: '一般閱覽座位', kind: 'reading', seats: 160,
    limitedOpening: { from: '2026-11-03', until: '2026-11-16', name: '1 樓閱覽區（試營運）' } };
  const duringTrial = evaluate(library, reading, { ...query, kind: 'reading' });
  assert.equal(duringTrial.status, 'yes');
  assert.equal(duringTrial.area?.name, '1 樓閱覽區（試營運）');
  assert.equal(duringTrial.area?.seats, undefined);
  assert.equal(evaluate(library, reading, { ...query, kind: 'reading', required: ['wifi'] }).status, 'unknown');
  const afterTrial = evaluate(library, reading, { ...query, date: '2026-11-17', kind: 'reading', required: ['wifi'] });
  assert.equal(afterTrial.status, 'yes');
  assert.equal(afterTrial.area?.seats, 160);
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

test('特殊時段只影響公告期間，新增一般閱覽區不會消除自修缺口', () => {
  const termArea = { ...area, slotPeriod: { from: '2026-09-14', until: '2027-01-17' } };
  assert.equal(evaluate(library, termArea, { ...query, start: 450 }).status, 'no');
  assert.equal(evaluate(library, termArea, { ...query, date: '2027-01-21', start: 450 }).status, 'unknown');
  const venue = { ...library, studyRoom: true, areas: [{ ...area, kind: 'reading' as const }] };
  assert.ok(coverageGaps(venue).includes('自修空間使用規則'));
});

test('市圖與國資圖的精武館舍使用同一個名錄鍵', () => {
  assert.equal(branchName('國立公共資訊圖書館精武分館'), branchName('精武圖書館'));
  assert.notEqual(branchName('國立公共資訊圖書館'), branchName('臺中市立圖書館總館'));
});
