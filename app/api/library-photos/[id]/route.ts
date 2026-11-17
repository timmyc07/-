import { libraryPhotos } from '../../../../lib/mongodb.ts';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await libraryPhotos().findOne({ _id: id }, { projection: { image: 1 } });
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo.image.value()), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
  });
}
