import { beforeEach, describe, expect, it } from "vitest";
import { cycleSearchHistory, loadSearchHistory, pushSearchHistory } from "./history.ts";

describe("cycleSearchHistory edge cases", () => {
  beforeEach(() => {
    localStorage.clear();
    pushSearchHistory("one");
    pushSearchHistory("two");
    pushSearchHistory("three");
  });

  it("returns current when history is empty", () => {
    localStorage.clear();
    expect(cycleSearchHistory("keep", "up")).toBe("keep");
    expect(cycleSearchHistory("keep", "down")).toBe("keep");
  });

  it("starts at most recent when moving down from empty input", () => {
    expect(cycleSearchHistory("", "down")).toBe("three");
  });

  it("moves down through older items", () => {
    expect(cycleSearchHistory("three", "down")).toBe("two");
    expect(cycleSearchHistory("two", "down")).toBe("one");
  });

  it("stops at oldest when moving down", () => {
    expect(cycleSearchHistory("one", "down")).toBe("one");
  });

  it("moves up through newer items", () => {
    expect(cycleSearchHistory("one", "up")).toBe("two");
    expect(cycleSearchHistory("two", "up")).toBe("three");
  });

  it("clears when moving up from most recent", () => {
    expect(cycleSearchHistory("three", "up")).toBe("");
  });

  it("clears when moving up from empty after reaching newest", () => {
    expect(cycleSearchHistory("", "up")).toBe("");
  });

  it("uses provided history snapshot", () => {
    expect(cycleSearchHistory("", "down", ["alpha", "beta"])).toBe("alpha");
  });

  it("handles unknown current value as not in history", () => {
    expect(cycleSearchHistory("missing", "down")).toBe("three");
    expect(cycleSearchHistory("missing", "up")).toBe("");
  });
});

describe("pushSearchHistory edge cases", () => {
  beforeEach(() => localStorage.clear());

  it("ignores blank queries", () => {
    pushSearchHistory("   ");
    expect(loadSearchHistory()).toEqual([]);
  });

  it("promotes duplicate to front", () => {
    pushSearchHistory("a");
    pushSearchHistory("b");
    pushSearchHistory("a");
    expect(loadSearchHistory()).toEqual(["a", "b"]);
  });
});
