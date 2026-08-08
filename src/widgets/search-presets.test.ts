import { describe, expect, it } from "vitest";
import { engineParam, matchEngine, resolveBang, SEARCH_ENGINES } from "./search-presets.ts";

describe("search presets", () => {
  it("matches engine by name and url", () => {
    const ddg = SEARCH_ENGINES[0]!;
    expect(matchEngine(ddg.name, ddg.url)?.id).toBe("ddg");
  });

  it("resolves bang syntax", () => {
    const bang = resolveBang("!gh typescript");
    expect(bang?.engine.id).toBe("github");
    expect(bang?.query).toBe("typescript");
  });

  it("returns null for unknown bang", () => {
    expect(resolveBang("!xyz test")).toBeNull();
    expect(resolveBang("no bang here")).toBeNull();
  });

  it("uses engine param fallback", () => {
    expect(engineParam(undefined)).toBe("q");
    expect(engineParam(SEARCH_ENGINES.find((e) => e.id === "wikipedia"))).toBe("search");
  });
});
