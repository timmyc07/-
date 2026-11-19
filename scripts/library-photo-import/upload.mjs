import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Binary } from 'mongodb';
import { mongoClient } from '../../lib/mongodb.ts';
import directory from '../../public/datasets/library-directory.json' with { type: 'json' };
import details from '../../public/datasets/library-details.json' with { type: 'json' };
import { withAnnouncedLibraries, withLibraryDetail } from '../../lib/library-details.ts';
import assets from './photos.json' with { type: 'json' };

const roster = withAnnouncedLibraries(
  directory.libraries.map(library => withLibraryDetail(library, details.libraries[library.id])),
);
assert.equal(new Set(assets.map(asset => asset._id)).size, assets.length);
const photos = await Promise.all(assets.map(async ({
  _id, name, address, source, author, license, licenseUrl, width, height, file, sha256,
}) => {
  const library = roster.find(item => item.id === _id);
  assert.ok(library?.name === name && library.address === address, name);
  assert.ok(file === `${_id}-${sha256.slice(0, 12)}.webp`, name);
  const bytes = await readFile(new URL(file, import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sha256, name);
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', name);
  return { _id, source, author, license, licenseUrl, width, height, image: new Binary(bytes) };
}));

if (process.env.RENDER_EXTERNAL_HOSTNAME !== 'studygo-a49h.onrender.com' ||
    process.env.RENDER_GIT_BRANCH !== 'main') {
  console.log(`Validated ${photos.length} library photos.`);
} else {
  const client = mongoClient();
  try {
    const collection = client.db('studygo_dev').collection('library_photos');
    for (const photo of photos) {
      const result = await collection.updateOne(
        { _id: photo._id },
        { $setOnInsert: photo },
        { upsert: true },
      );
      assert.equal(result.upsertedCount + result.matchedCount, 1, photo._id);
    }
    console.log(`Library photo import completed for ${photos.length} records.`);
  } finally {
    await client.close();
  }
}
