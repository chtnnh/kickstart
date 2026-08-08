import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultConfig } from "../config/defaults.ts";
import { renderTree } from "./render.ts";
import type { AppContext } from "../layout/engine.ts";
import { pushUndo } from "./undo.ts";

function makeCtx(editMode = false): AppContext {
  const config = createDefaultConfig();
  return { config, editMode, onConfigChange: vi.fn() };
}

describe("tree render behavior", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows collapse toggle in view mode", () => {
    const root = renderTree(makeCtx(false));
    expect(root.querySelector(".ks-collapse-btn")).toBeTruthy();
  });

  it("shows undo bar after undo stack has entries", () => {
    const ctx = makeCtx(true);
    pushUndo("test", ctx.config.tree.columns);
    renderTree(ctx);
    expect(document.querySelector(".ks-undo-bar")).toBeTruthy();
  });

  it("shows open-all control on categories", () => {
    const root = renderTree(makeCtx(false));
    expect(root.querySelector(".ks-category-open")).toBeTruthy();
  });

  it("renders inline url field wrapper in edit mode", () => {
    const root = renderTree(makeCtx(true));
    const row = root.querySelector(".bookmark-row");
    expect(row?.querySelector(".ks-field-input--name")).toBeTruthy();
    expect(row?.querySelector(".ks-url-field .ks-field-input--url")).toBeTruthy();
  });

  it("does not show delete toast when removing a link", () => {
    document.body.innerHTML = "";
    const ctx = makeCtx(true);
    const root = renderTree(ctx);
    const del = root.querySelector(".bookmark-row .ks-btn--danger") as HTMLButtonElement;
    vi.stubGlobal("confirm", () => true);
    del?.click();
    expect(document.querySelector(".ks-toast")).toBeFalsy();
    vi.unstubAllGlobals();
  });
});
