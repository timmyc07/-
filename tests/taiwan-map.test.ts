import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projectTaiwan, taiwanMap } from '../lib/taiwan-map.ts';

test('臺灣地圖保留本島與離島的方向，館舍座標可落在畫布內', () => {
  const taipei = projectTaiwan(121.543, 25.033);
  const kaohsiung = projectTaiwan(120.304, 22.614);
  const kinmen = projectTaiwan(118.315, 24.433);
  const matsu = projectTaiwan(119.951, 26.158);
  assert(taipei[1] < kaohsiung[1]);
  assert(kinmen[0] < kaohsiung[0]);
  assert(matsu[1] < taipei[1]);
  for (const [x, y] of [taipei, kaohsiung, kinmen, matsu]) {
    assert(x > 0 && x < taiwanMap.width && y > 0 && y < taiwanMap.height);
  }
});
