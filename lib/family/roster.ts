const STORAGE_KEY = "nexplay:family-roster:v1";

/** How many names are kept. A family plus a couple of regular guests fits
 * comfortably; anything older than this falls off the end. */
export const MAX_REMEMBERED_NAMES = 12;

/** Names typed into single-device setups, most recent first, remembered on
 * this device only (TASK-0039) — the fix for a family re-typing the same
 * names before every game. Device-local convenience data, same tier as
 * `lib/realtime/session.ts`'s remembered room session: never sent anywhere,
 * and losing it costs nothing but a few keystrokes. */
export function loadFamilyRoster(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeNames(parsed.filter((n): n is string => typeof n === "string"));
  } catch {
    return [];
  }
}

/** Records the names of a game that just started: they move to the front,
 * in the order given, ahead of anyone remembered from before. */
export function rememberFamilyNames(names: string[]): void {
  const next = normalizeNames([...names, ...loadFamilyRoster()]);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private browsing, quota) — not worth
    // interrupting a game over.
  }
}

/** The names a setup screen should start with: the remembered family (the
 * entry screen's name is remembered first, so the device owner leads),
 * padded with empty slots up to `minSlots` and capped at `maxSlots`. */
export function prefillNames(
  roster: string[],
  minSlots: number,
  maxSlots: number = Number.POSITIVE_INFINITY,
): string[] {
  const names = normalizeNames(roster).slice(0, maxSlots);
  while (names.length < minSlots) names.push("");
  return names;
}

/** Trims, drops blanks, and removes case-insensitive duplicates (keeping the
 * first occurrence), capped at MAX_REMEMBERED_NAMES. */
function normalizeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length === MAX_REMEMBERED_NAMES) break;
  }
  return result;
}
