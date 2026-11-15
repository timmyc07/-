import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../public/datasets/', import.meta.url);
const directory = JSON.parse(readFileSync(new URL('library-directory.json', root), 'utf8')) as {
  rawFile: string;
  sha256: string;
  count: number;
  rawCount: number;
  exclusions: { city: string; name: string }[];
  cityCounts: Record<string, number>;
  libraries: { id: string; city: string; name: string; areas: unknown[]; closures: unknown[] }[];
};

test('全臺名錄可追溯到原檔，保留 22 縣市且不填入未核對的空間規則', () => {
  const raw = readFileSync(new URL(directory.rawFile, root));
  const regions = JSON.parse(raw.toString('utf8')) as { 縣市: string; 圖書館資訊: { Name: string }[] }[];
  assert.equal(createHash('sha256').update(raw).digest('hex'), directory.sha256);
  assert.equal(regions.length, 22);
  assert.equal(regions.flatMap((region) => region.圖書館資訊).length, directory.rawCount);
  assert.equal(directory.libraries.length, directory.count);
  assert.equal(directory.count + directory.exclusions.length, directory.rawCount);
  assert.equal(new Set(directory.libraries.map(({ id }) => id)).size, directory.count);
  for (const region of regions) {
    const records = directory.libraries.filter((library) => library.city === region.縣市);
    const excluded = directory.exclusions.filter((item) => item.city === region.縣市).map(({ name }) => name);
    assert.equal(records.length, directory.cityCounts[region.縣市]);
    assert.deepEqual(records.map(({ name }) => name), region.圖書館資訊.map(({ Name }) => Name.trim())
      .filter((name) => !excluded.includes(name)));
    assert(records.every(({ areas, closures }) => areas.length === 0 && closures.length === 0));
  }
});
