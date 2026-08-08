import { beforeEach, describe, expect, it } from "vitest";
import { loadSearchHistory, pushSearchHistory } from "./history.ts";

describe("search history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores recent queries", () => {
    pushSearchHistory("vitest");
    pushSearchHistory("playwright");
    expect(loadSearchHistory()).toEqual(["playwright", "vitest"]);
  });

  it("deduplicates and caps at 5", () => {
    for (let i = 1; i <= 7; i++) pushSearchHistory(`q${i}`);
    expect(loadSearchHistory()).toHaveLength(5);
    expect(loadSearchHistory()[0]).toBe("q7");
  });

  it("skips calculator queries", () => {
    pushSearchHistory("=2+2");
    expect(loadSearchHistory()).toEqual([]);
  });

  it("returns empty array on invalid stored history", () => {
    localStorage.setItem("kickstart:search-history", "not-json");
    expect(loadSearchHistory()).toEqual([]);
  });
});
