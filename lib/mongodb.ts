import { MongoClient, MongoServerError } from 'mongodb';
import { diffAuditFields } from './field-audit.ts';
import { isPublicLibrary, type Snapshot } from './study.ts';

export function mongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('請在 .env 設定 MONGODB_URI');
  return new MongoClient(uri, { serverSelectionTimeoutMS: 4000, ignoreUndefined: true });
}

export function snapshots(client: MongoClient) {
  return client.db('studygo_dev').collection<Snapshot>('city_snapshots');
}

export async function saveTaichungSnapshot(collection: ReturnType<typeof snapshots>, snapshot: Snapshot) {
  const previous = await collection.findOne({ _id: snapshot._id });
  if (!previous) {
    try {
      await collection.insertOne(snapshot);
      return 0;
    } catch (error) {
      if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
      throw new Error('另一個臺中匯入已先完成，請重新執行');
    }
  }
  const changes = diffAuditFields(previous.libraries.filter(isPublicLibrary), snapshot.libraries.filter(isPublicLibrary),
    previous.fieldReviews, snapshot.fieldReviews);
  const importedAt = new Date(Math.max(Date.parse(snapshot.importedAt), Date.parse(previous.importedAt) + 1)).toISOString();
  const fieldHistory = previous.fieldHistory ?? [];
  // shortcut: 保留最近 20 批有變更的匯入，需要長期留存時再拆出歷史集合。
  const nextHistory = changes.length ? [{ importedAt, changes }, ...fieldHistory].slice(0, 20) : fieldHistory;
  const result = await collection.replaceOne({ _id: snapshot._id, importedAt: previous.importedAt }, {
    ...snapshot, importedAt, fieldHistory: nextHistory,
  });
  if (!result.matchedCount) throw new Error('另一個臺中匯入已先完成，請重新執行');
  return changes.length;
}

const globalMongo = globalThis as typeof globalThis & { studygoClient?: MongoClient };

export async function taichungSnapshot() {
  const client = globalMongo.studygoClient ??= mongoClient();
  const snapshot = await snapshots(client).findOne({ _id: 'taichung' });
  if (snapshot) snapshot.libraries = snapshot.libraries.filter(isPublicLibrary);
  return snapshot;
}
