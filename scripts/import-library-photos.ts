import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import { Binary } from 'mongodb';
import { libraryCatalog } from '../lib/library-catalog.ts';
import { libraryPhotos, mongoClient, type LibraryPhotoCredit } from '../lib/mongodb.ts';

const [mode, folder, ...ids] = process.argv.slice(2);
if (!folder || (mode !== 'review' && mode !== 'import') || !ids.length) {
  throw new Error('用法：review <暫存目錄> <館舍 ID 與 Commons 檔名的 JSON 檔>，或 import <暫存目錄> <已核對的館舍 ID>...');
}
const client = mongoClient();
const headers = { 'User-Agent': 'StudyGo photo curation (https://github.com/timmyc07/StudyGo)' };
const maxBytes = 12 * 1024 * 1024;
const safeId = /^[a-z\d-]+$/;
const ccLicense = /^https:\/\/creativecommons\.org\/(?:licenses\/by(?:-sa)?|publicdomain\/zero)\/\d\.\d\/?$/;
const governmentLicense = 'https://data.gov.tw/license';

type ImageInfo = {
  url: string;
  descriptionurl: string;
  width: number;
  height: number;
  size: number;
  mime: string;
  extmetadata: Record<string, { value: string } | undefined>;
};

try {
  const { libraries, snapshot } = await libraryCatalog(client);
  if (!snapshot) throw new Error('無法讀取臺中館舍快照');
  const names = new Map(libraries.map(({ id, name }) => [id, name]));
  const candidates: Record<string, string> = mode === 'review' ? JSON.parse(await readFile(ids[0], 'utf8')) : {};
  await mkdir(folder, { recursive: true });
  for (const id of mode === 'review' ? Object.keys(candidates) : ids) {
    const name = names.get(id);
    if (!safeId.test(id) || !name) throw new Error('館舍 ID 查無對應紀錄：' + id);
    const photoPath = join(folder, id + '.jpg');
    const creditPath = join(folder, id + '.json');
    if (mode === 'review') {
      try {
        const api = new URL('https://commons.wikimedia.org/w/api.php');
        api.search = new URLSearchParams({
          action: 'query', format: 'json', formatversion: '2', titles: 'File:' + candidates[id],
          prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata',
          iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|ImageDescription',
        }).toString();
        const result = await fetch(api, { headers, signal: AbortSignal.timeout(15000) });
        if (!result.ok) throw new Error('Commons 查詢失敗 ' + result.status);
        const info: ImageInfo | undefined = (await result.json()).query?.pages?.[0]?.imageinfo?.[0];
        if (!info || info.mime !== 'image/jpeg' || info.size > maxBytes || Math.min(info.width, info.height) < 480) {
          throw new Error('找不到館舍照片或照片格式與尺寸不合');
        }
        const metadata = info.extmetadata;
        const licenseUrl = metadata.LicenseUrl?.value.replace(/^http:\/\//, 'https://');
        const license = metadata.LicenseShortName?.value;
        const author = load(metadata.Artist?.value ?? '').text().trim();
        if (!licenseUrl || (!ccLicense.test(licenseUrl) && licenseUrl !== governmentLicense) || !license || !author) {
          throw new Error('缺少可核對的作者或授權');
        }
        const url = new URL(info.url);
        if (url.origin !== 'https://upload.wikimedia.org') throw new Error('非預期的圖片來源');
        url.search = '';
        const photo = await fetch(url, { headers, signal: AbortSignal.timeout(22000) });
        if (!photo.ok) throw new Error('圖片下載失敗 ' + photo.status);
        const image = Buffer.from(await photo.arrayBuffer());
        if (image.length !== info.size || image[0] !== 255 || image[1] !== 216) throw new Error('下載內容與照片資訊不符');
        const { width, height, descriptionurl: source } = info;
        const credit: LibraryPhotoCredit = { _id: id, width, height, source, author, license, licenseUrl };
        await writeFile(photoPath, image);
        await writeFile(creditPath, JSON.stringify(credit, null, 2));
        console.log(id, name, license, load(metadata.ImageDescription?.value ?? '').text().trim().slice(0, 180));
      } catch (error) {
        console.error(id, name, error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    } else {
      const credit: LibraryPhotoCredit = JSON.parse(await readFile(creditPath, 'utf8'));
      const image = await readFile(photoPath);
      if (credit._id !== id || image.length > maxBytes || image[0] !== 255 || image[1] !== 216) {
        throw new Error('暫存照片與館舍不符：' + id);
      }
      const result = await libraryPhotos(client).replaceOne({ _id: id }, { ...credit, image: new Binary(image) }, { upsert: true });
      if (!result.acknowledged) throw new Error('照片未寫入：' + id);
      console.log('已儲存', id, name);
    }
  }
} finally {
  await client.close();
}
