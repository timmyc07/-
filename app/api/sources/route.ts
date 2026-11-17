import { libraryCatalog } from '../../../lib/library-catalog.ts';
import { sourcesByHost } from '../../../lib/source-catalog.ts';

export async function GET(request: Request) {
  const host = new URL(request.url).searchParams.get('host');
  if (!host || host.length > 253) return Response.json([], { status: 400 });

  const { libraries, snapshot } = await libraryCatalog();
  const group = sourcesByHost(libraries, snapshot, host)[0];
  return group ? Response.json([...group[1]]) : Response.json([], { status: 404 });
}
