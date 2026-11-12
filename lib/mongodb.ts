import { MongoClient } from 'mongodb';
import { isPublicLibrary, type Snapshot } from './study.ts';

export function mongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('請在 .env 設定 MONGODB_URI');
  return new MongoClient(uri, { serverSelectionTimeoutMS: 4000, ignoreUndefined: true });
}

export function snapshots(client: MongoClient) {
  return client.db('studygo_dev').collection<Snapshot>('city_snapshots');
}

const globalMongo = globalThis as typeof globalThis & { studygoClient?: MongoClient };

export async function taichungSnapshot() {
  const client = globalMongo.studygoClient ??= mongoClient();
  const snapshot = await snapshots(client).findOne({ _id: 'taichung' });
  if (snapshot) snapshot.libraries = snapshot.libraries.filter(isPublicLibrary);
  return snapshot;
}
