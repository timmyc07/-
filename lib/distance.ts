import type { Library } from './study.ts';

type Coordinates = NonNullable<Library['coordinates']>;

export function parseCoordinates(value?: string): Coordinates | undefined {
  if (!value || !/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(value)) return;
  const [latitude, longitude] = value.split(',').map(Number);
  if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { latitude, longitude };
}

export function distanceKm(from?: Coordinates, to?: Coordinates) {
  if (!from || !to) return;
  const radians = Math.PI / 180;
  const a = Math.sin((to.latitude - from.latitude) * radians / 2) ** 2 +
    Math.cos(from.latitude * radians) * Math.cos(to.latitude * radians) *
    Math.sin((to.longitude - from.longitude) * radians / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function directionsUrl({ latitude, longitude }: Coordinates) {
  return 'https://www.google.com/maps/dir/?' + new URLSearchParams({
    api: '1', destination: latitude + ',' + longitude,
  });
}
