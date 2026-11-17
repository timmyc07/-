import sharp from 'sharp';

export async function libraryPhotoPreview(image: Buffer) {
  const original = await sharp(image).metadata();
  if (original.format === 'webp' && original.width! <= 800 && original.height! <= 800 && (!original.orientation || original.orientation === 1)) {
    return { image, width: original.width!, height: original.height! };
  }
  const pipeline = sharp(image).autoOrient()
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true });
  if (original.exif || original.iptc || original.xmp) pipeline.withMetadata({ orientation: 1 });
  const { data, info } = await pipeline
    .webp({ quality: 60, effort: 6 }).toBuffer({ resolveWithObject: true });
  return { image: data, width: info.width, height: info.height };
}
