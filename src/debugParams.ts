/** Debug/test-setup query params (?echoes=, ?loop=, ...) that seed initial state. */
export function getDebugNumberParam(search: string, key: string, fallback = 0): number {
  const raw = new URLSearchParams(search).get(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Comma-separated list param, e.g. ?owned=autoplay,fourbyfour for test setup. */
export function getDebugListParam(search: string, key: string): string[] {
  const raw = new URLSearchParams(search).get(key);
  if (!raw) return [];
  return raw.split(',').filter(Boolean);
}
