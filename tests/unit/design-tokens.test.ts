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
    ["success", "color-success", "color-on-success"],
    ["success-hover", "color-success-hover", "color-on-success"],
    ["ground", "color-ground", "color-on-ground"],
    ["game-impostor", "color-game-impostor", "color-on-game-impostor"],
    ["game-who-am-i", "color-game-who-am-i", "color-on-game-who-am-i"],
    ["game-connect4", "color-game-connect4", "color-on-game-connect4"],
    ["game-guess-who", "color-game-guess-who", "color-on-game-guess-who"],
    ["game-battleship", "color-game-battleship", "color-on-game-battleship"],
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
    ["gold on surface-sunken", "color-gold", "color-surface-sunken"],
    ["ink on surface-sunken", "color-ink", "color-surface-sunken"],
    ["accent on surface", "color-accent", "color-surface"],
    ["accent on surface-sunken", "color-accent", "color-surface-sunken"],
    // Red and green are also used as text on white (an impostor reveal, a
    // correct answer), not only as button backgrounds.
    ["action-primary as text on surface", "color-action-primary", "color-surface"],
    ["success as text on surface", "color-success", "color-surface"],
    ["action-danger as text on surface", "color-action-danger", "color-surface"],
  ];

  it.each(textOnSurfaces)("%s meets AA (>=4.5:1)", (_name, fgKey, bgKey) => {
    const fg = tokens[fgKey];
    const bg = tokens[bgKey];
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_MIN);
  });
});

// ADR-0004 1.1.0: the focus ring is non-text UI and must reach 3:1 against
// both things it can sit on — white plastic and the blue ground.
describe("design tokens — focus ring visibility (WCAG 1.4.11)", () => {
  it.each([
    ["on surface", "color-surface"],
    ["on ground", "color-ground"],
  ])("focus %s meets 3:1", (_name, bgKey) => {
    expect(contrastRatio(tokens["color-focus"], tokens[bgKey])).toBeGreaterThanOrEqual(3);
  });
});

// The sea has to read as different from both a hit and an unfired cell by
// lightness, not hue alone (founder feedback 2026-08-15).
describe("design tokens — Battleship water separation", () => {
  it("water is distinguishable from a hit and from an unfired cell", () => {
    expect(contrastRatio(tokens["color-water"], tokens["color-action-danger"])).toBeGreaterThanOrEqual(1.8);
    expect(contrastRatio(tokens["color-water"], tokens["color-surface-well"])).toBeGreaterThanOrEqual(3);
  });
});
