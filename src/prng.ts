/**
 * Deterministic PRNG for the opponent, injectable via the `?seed=` query
 * parameter so behavioural tests never depend on Math.random().
 */

/** Hashes an arbitrary string into a 32-bit unsigned int (xfnv1a). */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: small, fast, good-enough PRNG for a game opponent. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

/** Builds a seeded RNG from a string seed. Same seed -> same sequence, always. */
export function createRng(seed: string): Rng {
  return mulberry32(hashSeed(seed));
}

/** Picks a random element from a non-empty array using the given RNG. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function getSeedFromLocation(search: string): string {
  return new URLSearchParams(search).get('seed') ?? 'default';
}
