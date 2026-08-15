import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ADR-0004 §4: every action/text color pair gets a contrast test, not a
 * manual check. Reads the real app/tokens.css (no duplicated palette to
 * drift out of sync) so this test breaks the moment someone edits a token
 * value into a failing pair.
 */

function parseTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const re = /--(color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexToRgb(hexA));
  const l2 = relativeLuminance(hexToRgb(hexB));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const css = readFileSync(join(__dirname, "../../app/tokens.css"), "utf-8");
const tokens = parseTokens(css);

const AA_MIN = 4.5;

describe("design tokens — WCAG AA contrast (ADR-0004 §4)", () => {
  const actionPairs: Array<[string, string, string]> = [
    ["action-primary", "color-action-primary", "color-on-primary"],
    ["action-secondary", "color-action-secondary", "color-on-secondary"],
    ["action-danger", "color-action-danger", "color-on-danger"],
    ["success-surface", "color-success-surface", "color-on-success-surface"],
    ["danger-surface", "color-danger-surface", "color-on-danger-surface"],
    ["water", "color-water", "color-on-water"],
  ];

  it.each(actionPairs)("%s bg/on pair meets AA (>=4.5:1)", (_name, bgKey, fgKey) => {
    const bg = tokens[bgKey];
    const fg = tokens[fgKey];
    expect(bg, `${bgKey} missing from app/tokens.css`).toBeDefined();
    expect(fg, `${fgKey} missing from app/tokens.css`).toBeDefined();
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_MIN);
  });

  const textOnSurfaces: Array<[string, string, string]> = [
    ["ink on surface", "color-ink", "color-surface"],
    ["ink on surface-raised", "color-ink", "color-surface-raised"],
    ["ink-muted on surface", "color-ink-muted", "color-surface"],
    ["ink-muted on surface-raised", "color-ink-muted", "color-surface-raised"],
    ["ink-muted on surface-sunken", "color-ink-muted", "color-surface-sunken"],
    ["ink-muted on surface-well", "color-ink-muted", "color-surface-well"],
    ["gold on surface", "color-gold", "color-surface"],
    ["gold on surface-raised", "color-gold", "color-surface-raised"],
    ["on-penumbra on penumbra-ground", "color-on-penumbra", "color-penumbra-ground"],
    ["on-penumbra-muted on penumbra-ground", "color-on-penumbra-muted", "color-penumbra-ground"],
    ["penumbra-danger on penumbra-ground", "color-penumbra-danger", "color-penumbra-ground"],
    ["penumbra-success on penumbra-ground", "color-penumbra-success", "color-penumbra-ground"],
  ];

  it.each(textOnSurfaces)("%s meets AA (>=4.5:1)", (_name, fgKey, bgKey) => {
    const fg = tokens[fgKey];
    const bg = tokens[bgKey];
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_MIN);
  });

  // Battleship's board is unreadable if its three cell states look alike —
  // the founder reported exactly that (2026-08-15): every shot rendered red,
  // so water and a hit were indistinguishable. These are the board's whole
  // feedback vocabulary, so guard that they stay tellable apart by
  // *lightness*, not only hue — hue alone is the first thing to fail in
  // sunlight or with red-green color blindness. The first draft of
  // --color-water was a navy that paired beautifully with white but sat at
  // 1.11:1 against the wine red, which is what this assertion caught.
  const boardStates: Array<[string, string, string]> = [
    ["water vs hit", "color-water", "color-action-danger"],
    ["water vs unfired cell", "color-water", "color-surface-sunken"],
    ["hit vs unfired cell", "color-action-danger", "color-surface-sunken"],
  ];

  it.each(boardStates)("%s are distinguishable by lightness (>=2:1)", (_name, aKey, bKey) => {
    const a = tokens[aKey];
    const b = tokens[bKey];
    expect(a, `${aKey} missing from app/tokens.css`).toBeDefined();
    expect(b, `${bKey} missing from app/tokens.css`).toBeDefined();
    expect(a).not.toBe(b);
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(2);
  });
});
