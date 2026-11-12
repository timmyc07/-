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
