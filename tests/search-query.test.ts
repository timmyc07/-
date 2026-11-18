import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSearchText, requestedPage, searchRegion, searchTime } from '../lib/search-query.ts';

test('搜尋接受台臺異體與全形文字，地區不相符時保留縣市供重新選擇', () => {
  const regions = { 臺北市: ['大安區'], 臺中市: ['西區'] };
  assert.equal(normalizeSearchText(' 台北１０１ '), '臺北101');
  assert.deepEqual(searchRegion(regions, '台北市', '大安區'), { city: '臺北市', district: '大安區', invalidRegion: false });
  assert.deepEqual(searchRegion(regions, '台北市', '西區'), { city: '臺北市', district: '', invalidRegion: true });
  assert.equal(searchRegion(regions, '不存在的城市').invalidRegion, true);
});

test('無效日期及時段給出可重新送出的表單值，保留可用到午夜的查詢', () => {
  const today = '2026-11-18';
  const invalid = searchTime(today, '2026-02-31', '25:00', '-1');
  assert.equal(invalid.invalidTime, true);
  assert.deepEqual([invalid.formDate, invalid.formStart, invalid.formDuration], [today, '14:00', 120]);
  const crossMidnight = searchTime(today, today, '23:50', '20');
  assert.equal(crossMidnight.invalidTime, true);
  assert.equal(crossMidnight.formDuration, 10);
  assert.equal(searchTime(today, today, '23:50', '10').invalidTime, false);
  assert.equal(searchTime(today, today, '14:00', '1.5').invalidTime, true);
  assert.equal(searchTime(today).changed, false);
});

test('跳頁依數字欄位的整數值處理，無效頁碼回到第一頁', () => {
  assert.equal(requestedPage('2e1'), 20);
  assert.equal(requestedPage('2.5'), 1);
  assert.equal(requestedPage('2oops'), 1);
  assert.equal(requestedPage('0'), 1);
});
