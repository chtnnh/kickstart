import { describe, expect, it } from "vitest";
import { getSearchLabel, applySearchEngine } from "./search-utils.ts";
import { SEARCH_ENGINES } from "./search-presets.ts";

describe("search utils", () => {
  it("returns custom label when set", () => {
    expect(getSearchLabel({ name: "ddg", url: "x", label: "Search" })).toBe("Search");
  });

  it("applies engine to search config", () => {
    const search = { name: "ddg", url: "https://duckduckgo.com/?q=" };
    applySearchEngine(search, SEARCH_ENGINES.find((e) => e.id === "google")!);
    expect(search.name).toBe("google");
    expect(search.url).toContain("google.com");
  });

  it("falls back to engine name when no custom label", () => {
    expect(getSearchLabel({ name: "ddg", url: "https://duckduckgo.com/?q=" })).toBe("ddg");
  });

  it("falls back to config name for unknown engines", () => {
    expect(getSearchLabel({ name: "mysearch", url: "https://example.com/?q=" })).toBe("mysearch");
  });
});
