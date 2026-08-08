import { beforeEach, describe, expect, it } from "vitest";
import {
  allCatKeys,
  catKey,
  isCategoryCollapsed,
  loadCollapsed,
  loadCollapseAll,
  saveCollapseAll,
  saveCollapsed,
  toggleCategoryCollapsed,
  toggleCollapseAll,
} from "./collapse-state.ts";

const columns = [[{ cn: "a", b: [] }, { cn: "b", b: [] }]];

describe("collapse state", () => {
  beforeEach(() => {
    localStorage.clear();
    saveCollapseAll(false);
  });

  it("persists collapsed category keys", () => {
    const keys = new Set([catKey(0, 1)]);
    saveCollapsed(keys);
    expect(loadCollapsed()).toEqual(keys);
  });

  it("tracks collapse-all mode", () => {
    saveCollapseAll(true);
    expect(loadCollapseAll()).toBe(true);
    expect(isCategoryCollapsed(0, 0, true, new Set())).toBe(true);
  });

  it("expands one category when collapse-all is active", () => {
    const result = toggleCategoryCollapsed(0, 1, columns, true, new Set());
    expect(result.collapseAll).toBe(false);
    expect(result.collapsed).toBe(false);
    expect(result.manual.has(catKey(0, 0))).toBe(true);
    expect(result.manual.has(catKey(0, 1))).toBe(false);
  });

  it("lists all category keys", () => {
    expect(allCatKeys(columns)).toEqual(["0:0", "0:1"]);
  });

  it("toggles collapse-all", () => {
    const on = toggleCollapseAll(columns);
    expect(on.collapseAll).toBe(true);
    const off = toggleCollapseAll(columns);
    expect(off.collapseAll).toBe(false);
  });

  it("returns empty set on invalid stored JSON", () => {
    localStorage.setItem("kickstart:tree-collapsed", "not-json");
    expect(loadCollapsed().size).toBe(0);
  });

  it("toggles manual collapse state", () => {
    const manual = new Set<string>();
    const first = toggleCategoryCollapsed(0, 0, columns, false, manual);
    expect(first.collapsed).toBe(true);
    const second = toggleCategoryCollapsed(0, 0, columns, false, first.manual);
    expect(second.collapsed).toBe(false);
  });
});
