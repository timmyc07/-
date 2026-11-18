export const taiwanMap = { width: 560, height: 540 };

export function projectTaiwan(longitude: number, latitude: number): [number, number] {
  // The coast and the library coordinates use the same equirectangular projection.
  return [340 + (longitude - 120.85) * 102, 24 + (26.45 - latitude) * 112];
}
