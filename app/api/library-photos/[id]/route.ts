import { libraryPhotos } from '../../../../lib/mongodb.ts';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let photo;
  try {
    photo = await libraryPhotos().findOne({ _id: id }, { projection: { image: 1 } });
  } catch (error) {
    console.error('無法讀取館舍照片', error instanceof Error ? error.name : error);
    return new Response(null, { status: 503 });
  }
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.image.value()), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=3600' },
  });
}
