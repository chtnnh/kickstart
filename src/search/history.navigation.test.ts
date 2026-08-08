import { beforeEach, describe, expect, it } from "vitest";
import { cycleSearchHistory, pushSearchHistory } from "./history.ts";

describe("search history navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    pushSearchHistory("alpha");
    pushSearchHistory("beta");
    pushSearchHistory("gamma");
  });

  it("cycles down through recent searches", () => {
    expect(cycleSearchHistory("", "down")).toBe("gamma");
    expect(cycleSearchHistory("gamma", "down")).toBe("beta");
    expect(cycleSearchHistory("beta", "down")).toBe("alpha");
  });

  it("cycles up through recent searches", () => {
    expect(cycleSearchHistory("alpha", "up")).toBe("beta");
    expect(cycleSearchHistory("beta", "up")).toBe("gamma");
  });

  it("clears search when moving up past the most recent item", () => {
    expect(cycleSearchHistory("gamma", "up")).toBe("");
    expect(cycleSearchHistory("", "up")).toBe("");
  });

  it("stays at oldest when moving down past history", () => {
    expect(cycleSearchHistory("alpha", "down")).toBe("alpha");
  });
});
