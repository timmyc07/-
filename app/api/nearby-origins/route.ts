import { libraryCatalog } from '../../../lib/library-catalog.ts';

export async function GET() {
  const { libraries } = await libraryCatalog();
  return Response.json(libraries.filter(({ coordinates }) => coordinates)
    .map(({ id, name, city }) => ({ id, name: city + ' · ' + name })));
}
