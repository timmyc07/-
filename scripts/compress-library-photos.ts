import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Binary } from 'mongodb';
import { libraryPhotoPreview } from '../lib/library-photo-preview.ts';
import { libraryPhotos, mongoClient } from '../lib/mongodb.ts';

const reportFolder = '.local';
const sha256 = (image: Uint8Array) => createHash('sha256').update(image).digest('hex');
const client = mongoClient();
const report: { id: string; before: number; after: number }[] = [];
try {
  await mkdir(reportFolder, { recursive: true });
  const collection = libraryPhotos(client);
  const ids = await collection.find({}).project<{ _id: string }>({ _id: 1 }).toArray();
  for (const { _id } of ids) {
    assert.match(_id, /^[a-z\d-]+$/);
    const photo = await collection.findOne({ _id });
    assert.ok(photo, '照片已被其他工作移除：' + _id);
    const original = Buffer.from(photo.image.value());

    const preview = await libraryPhotoPreview(original);
    assert.ok(preview.image.length <= original.length, '壓縮後容量不可增加');
    assert.ok(preview.width <= 800 && preview.height <= 800);
    if (!preview.image.equals(original)) {
      // 原子更新同一筆照片；若有其他工作換圖，保留對方版本並停止。
      const result = await collection.updateOne({ _id, image: photo.image }, { $set: {
        image: new Binary(preview.image), width: preview.width, height: preview.height,
      } });
      assert.equal(result.matchedCount, 1, '照片已被其他工作修改：' + _id);
    }
    const saved = await collection.findOne({ _id });
    assert.ok(saved);
    assert.equal(sha256(saved.image.value()), sha256(preview.image));
    assert.equal(saved.width, preview.width);
    assert.equal(saved.height, preview.height);
    for (const key of ['source', 'author', 'license', 'licenseUrl'] as const) {
      assert.equal(saved[key], photo[key], '來源或授權不可變更');
    }
    report.push({ id: _id, before: original.length, after: preview.image.length });
    await writeFile(join(reportFolder, 'photo-compression-report.json'), JSON.stringify(report, null, 2));
    if (report.length % 20 === 0) console.log(`已壓縮並驗證 ${report.length}/${ids.length}`);
  }
  assert.equal(await collection.countDocuments({}), ids.length, '照片總數不可變更');
  const before = report.reduce((sum, row) => sum + row.before, 0);
  const after = report.reduce((sum, row) => sum + row.after, 0);
  console.log(JSON.stringify({ photos: report.length, before, after, saved: before - after }));
} finally {
  await client.close();
}
