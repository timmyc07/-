import { unstable_cache } from 'next/cache';
import directory from '../public/datasets/library-directory.json' with { type: 'json' };
import details from '../public/datasets/library-details.json' with { type: 'json' };
import { withAnnouncedLibraries, withLibraryDetail, withTaichungDirectoryDetails, type LibraryDetail } from './library-details.ts';
import { taichungSnapshot } from './mongodb.ts';
import type { Library } from './study.ts';

export type RegionalLibrary = Library & { city: string };

const publicSnapshot = unstable_cache(() => taichungSnapshot(), ['studygo-public-taichung-snapshot'], { revalidate: 30 });
const national = withAnnouncedLibraries(directory.libraries.map((library) =>
  withLibraryDetail(library, (details.libraries as Record<string, LibraryDetail | undefined>)[library.id])));
const taichung = national.filter((library) => library.city === '臺中市');
const outsideTaichung = national.filter((library) => library.city !== '臺中市');

export async function libraryCatalog() {
  const snapshot = await publicSnapshot().catch(() => null);
  const libraries: RegionalLibrary[] = snapshot?.libraries.length
    ? [...outsideTaichung,
      ...snapshot.libraries.map((library) => ({ ...withTaichungDirectoryDetails(library, taichung), city: '臺中市' }))]
    : national;
  return { libraries, snapshot };
}
