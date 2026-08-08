import { describe, expect, it, vi } from "vitest";
import { duplicateCategory, openAllInCategory } from "./actions.ts";
import type { BookmarkCategory } from "../config/types.ts";

describe("tree actions", () => {
  it("duplicates a category with copied links", () => {
    const columns = [[{ cn: "Work", b: [{ n: "Docs", u: "https://docs.example.com" }] }]];
    duplicateCategory(columns, 0, 0);
    expect(columns[0]).toHaveLength(2);
    expect(columns[0]![1]!.cn).toBe("Work (copy)");
    expect(columns[0]![1]!.b[0]!.u).toBe("https://docs.example.com");
    expect(columns[0]![1]!.b).not.toBe(columns[0]![0]!.b);
  });

  it("opens all links in a category", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const cat: BookmarkCategory = {
      cn: "x",
      b: [
        { n: "a", u: "https://a.com" },
        { n: "b", u: "b.com" },
        { n: "empty", u: "" },
      ],
    };
    openAllInCategory(cat);
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledWith("https://a.com", "_blank", "noopener,noreferrer");
    expect(open).toHaveBeenCalledWith("https://b.com", "_blank", "noopener,noreferrer");
    vi.unstubAllGlobals();
  });
});
