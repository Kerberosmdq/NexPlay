type Messages = { [key: string]: string | Messages };

function collectKeyPaths(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? [path]
      : collectKeyPaths(value, path);
  });
}

export interface MessageParityResult {
  ok: boolean;
  missingInA: string[];
  missingInB: string[];
}

/**
 * Compares two locale message catalogs by key path and reports any drift.
 * Used to guard against a translation being added in one locale and
 * forgotten in another (ADR-0003, Seam 4 — no hardcoded/orphaned strings).
 */
export function checkMessageParity(a: Messages, b: Messages): MessageParityResult {
  const keysA = new Set(collectKeyPaths(a));
  const keysB = new Set(collectKeyPaths(b));

  const missingInA = [...keysB].filter((key) => !keysA.has(key)).sort();
  const missingInB = [...keysA].filter((key) => !keysB.has(key)).sort();

  return {
    ok: missingInA.length === 0 && missingInB.length === 0,
    missingInA,
    missingInB,
  };
}
