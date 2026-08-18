const LAST_SEEN_KEY = 'nine-squares:lastSeen';

// Below this, a normal reload would trigger a "while you were away" message
// for a few hundred milliseconds of tab-closing time — not worth reporting.
const MIN_OFFLINE_MS = 60_000;
const OFFLINE_CAP_MS = 6 * 60 * 60 * 1000;
const ECHOES_PER_OFFLINE_SECOND = 0.2;

export interface OfflineCredit {
  echoes: number;
  cappedElapsedMs: number;
}

export function readLastSeen(): number | null {
  const raw = localStorage.getItem(LAST_SEEN_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function writeLastSeen(now: number): void {
  localStorage.setItem(LAST_SEEN_KEY, String(now));
}

export function computeOfflineCredit(lastSeen: number, now: number): OfflineCredit | null {
  const elapsedMs = now - lastSeen;
  if (elapsedMs < MIN_OFFLINE_MS) return null;
  const cappedElapsedMs = Math.min(elapsedMs, OFFLINE_CAP_MS);
  const echoes = Math.floor((cappedElapsedMs / 1000) * ECHOES_PER_OFFLINE_SECOND);
  return { echoes, cappedElapsedMs };
}

export function formatOfflineSummary(credit: OfflineCredit): string {
  const minutes = Math.round(credit.cappedElapsedMs / 60_000);
  return `Echoes accrued while you were away (${minutes}m): ${credit.echoes}.`;
}
