/** Deterministic hash from string → non-negative int */
export function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Seeded [0, 1) from string */
export function seededUnit(seed: string): number {
  const h = hashString(seed);
  return (h % 10000) / 10000;
}

/** Seeded float in [min, max) */
export function seededRange(seed: string, min: number, max: number): number {
  return min + seededUnit(seed) * (max - min);
}

/** Seeded integer in [min, max] inclusive */
export function seededInt(seed: string, min: number, max: number): number {
  return min + (hashString(seed) % (max - min + 1));
}
