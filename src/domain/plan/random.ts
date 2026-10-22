/** Kleiner deterministischer Zufallsgenerator (mulberry32). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wählt `count` verschiedene Elemente gewichtet (ohne Zurücklegen). */
export function weightedSample<T>(
  items: T[],
  weight: (item: T) => number,
  count: number,
  rng: () => number,
): T[] {
  const pool = items.map((item) => ({ item, w: Math.max(0.0001, weight(item)) }));
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].w;
      if (r <= 0) break;
    }
    out.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return out;
}
