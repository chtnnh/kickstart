import { afterEach, describe, expect, it, vi } from "vitest";
import { initKeyboardShortcuts, showShortcutHelp } from "./keyboard.ts";
import { createDefaultConfig } from "../config/defaults.ts";
import { renderSearchBar } from "../widgets/search.ts";
import "../styles/ui.css";

describe("keyboard shortcuts", () => {
  let unbind: (() => void) | undefined;

  afterEach(() => {
    unbind?.();
    unbind = undefined;
    document.body.innerHTML = "";
  });

  it("focuses search on /", () => {
    const config = createDefaultConfig();
    document.body.appendChild(renderSearchBar({ config, editMode: false, onConfigChange: vi.fn() }));
    const input = document.getElementById("ks-search-input") as HTMLInputElement;
    const focusSpy = vi.spyOn(input, "focus");

    unbind = initKeyboardShortcuts({
      toggleEdit: vi.fn(),
      openCommandPalette: vi.fn(),
      closeOverlays: vi.fn(),
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "/", cancelable: true }));
    expect(focusSpy).toHaveBeenCalled();
  });

  it("toggles edit mode on e", () => {
    const toggleEdit = vi.fn();
    unbind = initKeyboardShortcuts({
      toggleEdit,
      openCommandPalette: vi.fn(),
      closeOverlays: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", cancelable: true }));
    expect(toggleEdit).toHaveBeenCalled();
  });

  it("ignores shortcuts while typing in inputs", () => {
    const toggleEdit = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    unbind = initKeyboardShortcuts({
      toggleEdit,
      openCommandPalette: vi.fn(),
      closeOverlays: vi.fn(),
    });
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "e", cancelable: true, bubbles: true }));
    expect(toggleEdit).not.toHaveBeenCalled();
  });

  it("blurs search on Escape before closing overlays", () => {
    const config = createDefaultConfig();
    document.body.appendChild(renderSearchBar({ config, editMode: false, onConfigChange: vi.fn() }));
    const input = document.getElementById("ks-search-input") as HTMLInputElement;
    input.focus();
    const closeOverlays = vi.fn();
    unbind = initKeyboardShortcuts({
      toggleEdit: vi.fn(),
      openCommandPalette: vi.fn(),
      closeOverlays,
    });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
    expect(document.activeElement).not.toBe(input);
    expect(closeOverlays).not.toHaveBeenCalled();
  });

  it("opens settings on comma", () => {
    const openSettings = vi.fn();
    unbind = initKeyboardShortcuts({
      toggleEdit: vi.fn(),
      openCommandPalette: vi.fn(),
      closeOverlays: vi.fn(),
      openSettings,
    });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: ",", cancelable: true }));
    expect(openSettings).toHaveBeenCalled();
  });

  it("renders help table with compact font size", () => {
    showShortcutHelp();
    expect(document.querySelector(".ks-shortcuts-table--compact")).toBeTruthy();
    document.querySelector(".ks-shortcuts-overlay")?.remove();
  });

  it("opens command palette on meta+k", () => {
    const openCommandPalette = vi.fn();
    unbind = initKeyboardShortcuts({
      toggleEdit: vi.fn(),
      openCommandPalette,
      closeOverlays: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, cancelable: true }));
    expect(openCommandPalette).toHaveBeenCalled();
  });

  it("closes overlays on Escape when search is not focused", () => {
    const closeOverlays = vi.fn();
    unbind = initKeyboardShortcuts({
      toggleEdit: vi.fn(),
      openCommandPalette: vi.fn(),
      closeOverlays,
    });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
    expect(closeOverlays).toHaveBeenCalled();
  });

  it("does not open settings on comma while typing in textarea", () => {
    const openSettings = vi.fn();
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();
    unbind = initKeyboardShortcuts({
      toggleEdit: vi.fn(),
      openCommandPalette: vi.fn(),
      closeOverlays: vi.fn(),
      openSettings,
    });
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: ",", cancelable: true, bubbles: true }));
    expect(openSettings).not.toHaveBeenCalled();
  });

  it("opens shortcut help on shift+?", () => {
    unbind = initKeyboardShortcuts({
      toggleEdit: vi.fn(),
      openCommandPalette: vi.fn(),
      closeOverlays: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", shiftKey: true, cancelable: true }));
    expect(document.querySelector(".ks-shortcuts-overlay")).toBeTruthy();
    document.querySelector(".ks-shortcuts-overlay")?.remove();
  });

  it("closes shortcut help when clicking backdrop", () => {
    showShortcutHelp();
    const overlay = document.querySelector(".ks-shortcuts-overlay") as HTMLElement;
    overlay.click();
    expect(document.querySelector(".ks-shortcuts-overlay")).toBeNull();
  });
});
