// Random number helpers. `secureRng` uses crypto.getRandomValues; `createRng`
// is a deterministic, seedable generator (sfc32) used for daily cards and tests.

export type Rng = {
  /** Uniform integer in [0, limit) without modulo bias. */
  int(limit: number): number;
};

const RANGE = 0x100000000;

function fromUint32(next: () => number): Rng {
  return {
    int(limit) {
      if (!Number.isInteger(limit) || limit < 1 || limit > RANGE)
        throw new RangeError(`limit must be an integer in 1..2^32, got ${limit}`);
      const max = RANGE - (RANGE % limit);
      let n: number;
      do n = next();
      while (n >= max);
      return n % limit;
    },
  };
}

export const secureRng: Rng = fromUint32(() => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
});

/** cyrb128-style string hash -> four 32-bit words. */
function hash128(str: string): [number, number, number, number] {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

/** Stable 32-bit hash of a string, e.g. userId + date. */
export function hashSeed(input: string) {
  return hash128(input)[0];
}

export function createRng(seed: string | number): Rng {
  let [a, b, c, d] = hash128(String(seed));
  const next = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t;
  };
  for (let i = 0; i < 12; i++) next();
  return fromUint32(next);
}

/** Fisher-Yates; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}
