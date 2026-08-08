import { beforeEach, describe, expect, it } from "vitest";
import { popUndo, pushUndo, undoDepth, clearUndo } from "./undo.ts";
import type { BookmarkColumn } from "../config/types.ts";

const sample: BookmarkColumn[] = [[{ cn: "a", b: [{ n: "x", u: "https://x.com" }] }]];

describe("tree undo", () => {
  beforeEach(() => {
    while (popUndo()) {
      /* drain */
    }
  });

  it("pushes and pops snapshots", () => {
    pushUndo("delete", sample);
    expect(undoDepth()).toBe(1);
    const entry = popUndo();
    expect(entry?.label).toBe("delete");
    expect(entry?.columns[0]![0]!.cn).toBe("a");
  });

  it("caps stack depth", () => {
    for (let i = 0; i < 12; i++) pushUndo(`op-${i}`, sample);
    expect(undoDepth()).toBe(10);
    expect(popUndo()?.label).toBe("op-11");
  });

  it("returns undefined when stack is empty", () => {
    expect(popUndo()).toBeUndefined();
  });

  it("clears undo stack", () => {
    pushUndo("delete", sample);
    clearUndo();
    expect(undoDepth()).toBe(0);
  });
});
