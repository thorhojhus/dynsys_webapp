// Seeded random number generator using Mulberry32 algorithm
export function createRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: () => number, min: number, max: number, excludeZero = false): number {
  let value: number;
  do {
    value = Math.floor(rng() * (max - min + 1)) + min;
  } while (excludeZero && value === 0);
  return value;
}

export function randomChoice<T>(rng: () => number, array: T[]): T {
  return array[Math.floor(rng() * array.length)];
}

export function shuffle<T>(rng: () => number, array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Generate distinct random integers
export function randomDistinctInts(
  rng: () => number,
  min: number,
  max: number,
  count: number,
  excludeZero = false
): number[] {
  const result: number[] = [];
  const available = [];
  for (let i = min; i <= max; i++) {
    if (!excludeZero || i !== 0) available.push(i);
  }

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(rng() * available.length);
    result.push(available[idx]);
    available.splice(idx, 1);
  }
  return result;
}
