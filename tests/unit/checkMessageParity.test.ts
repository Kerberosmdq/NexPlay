import { describe, expect, it } from "vitest";
import { checkMessageParity } from "@/i18n/checkMessageParity";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

describe("checkMessageParity", () => {
  it("detects matching catalogs as ok", () => {
    const result = checkMessageParity({ a: { b: "x" } }, { a: { b: "y" } });
    expect(result.ok).toBe(true);
  });

  it("reports keys missing from either side", () => {
    const result = checkMessageParity(
      { a: "x", b: "x" },
      { a: "y" },
    );
    expect(result.ok).toBe(false);
    expect(result.missingInB).toEqual(["b"]);
    expect(result.missingInA).toEqual([]);
  });

  it("keeps the real en/es catalogs in parity", () => {
    const result = checkMessageParity(en, es);
    expect(result).toEqual({ ok: true, missingInA: [], missingInB: [] });
  });
});
