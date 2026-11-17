import directory from '../public/datasets/library-directory.json' with { type: 'json' };
import details from '../public/datasets/library-details.json' with { type: 'json' };
import { withAnnouncedLibraries, withLibraryDetail, withTaichungDirectoryDetails, type LibraryDetail } from './library-details.ts';
import { taichungSnapshot } from './mongodb.ts';
import type { Library } from './study.ts';
import type { MongoClient } from 'mongodb';

export type RegionalLibrary = Library & { city: string };

export async function libraryCatalog(client?: MongoClient) {
  const snapshot = await taichungSnapshot(client).catch(() => null);
  const national = withAnnouncedLibraries(directory.libraries.map((library) =>
    withLibraryDetail(library, (details.libraries as Record<string, LibraryDetail | undefined>)[library.id])));
  const taichung = national.filter((library) => library.city === '臺中市');
  const libraries: RegionalLibrary[] = snapshot?.libraries.length
    ? [...national.filter((library) => library.city !== '臺中市'),
      ...snapshot.libraries.map((library) => ({ ...withTaichungDirectoryDetails(library, taichung), city: '臺中市' }))]
    : national;
  return { libraries, snapshot };
}
