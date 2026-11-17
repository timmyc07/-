import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { libraryPhotoPreview } from '../lib/library-photo-preview.ts';

test('卡片預覽保留完整畫面並縮到 800 像素內', async () => {
  const source = await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#258' } })
    .jpeg({ quality: 100 }).toBuffer();
  const preview = await libraryPhotoPreview(source);
  assert.equal(preview.width, 800);
  assert.equal(preview.height, 450);
  assert.ok(preview.image.length < source.length);
  assert.equal((await sharp(preview.image).metadata()).format, 'webp');
});

test('不放大小圖，也不增加已壓縮照片的容量', async () => {
  const source = await sharp({ create: { width: 160, height: 100, channels: 3, background: '#eee' } })
    .jpeg({ quality: 35 }).toBuffer();
  const preview = await libraryPhotoPreview(source);
  assert.equal(preview.width, 160);
  assert.equal(preview.height, 100);
  assert.ok(preview.image.length <= source.length);
});

test('套用 EXIF 旋轉並保留著作權資訊', async () => {
  const source = await sharp({ create: { width: 1200, height: 600, channels: 3, background: '#258' } })
    .withExif({ IFD0: { Copyright: 'Photo author' } })
    .withMetadata({ orientation: 6 }).jpeg({ quality: 100 }).toBuffer();
  const preview = await libraryPhotoPreview(source);
  assert.equal(preview.width, 400);
  assert.equal(preview.height, 800);
  const metadata = await sharp(preview.image).metadata();
  assert.equal(metadata.orientation, 1);
  assert.ok(metadata.exif?.includes(Buffer.from('Photo author')));
});

test('小圖正確套用旋轉，再次處理預覽不重複壓縮', async () => {
  const source = await sharp({ create: { width: 300, height: 150, channels: 3, background: '#258' } })
    .withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const preview = await libraryPhotoPreview(source);
  assert.equal(preview.width, 150);
  assert.equal(preview.height, 300);
  assert.deepEqual((await libraryPhotoPreview(preview.image)).image, preview.image);
});
