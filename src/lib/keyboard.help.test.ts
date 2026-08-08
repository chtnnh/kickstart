import { describe, expect, it } from "vitest";
import { showShortcutHelp } from "./keyboard.ts";

describe("keyboard help", () => {
  it("renders shortcuts dialog", () => {
    showShortcutHelp();
    expect(document.querySelector(".ks-shortcuts-table")).toBeTruthy();
    expect(document.querySelector(".ks-shortcuts-table kbd")?.textContent).toBe("/");
    document.querySelector(".ks-shortcuts-overlay")?.remove();
  });
});
