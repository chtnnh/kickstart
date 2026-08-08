import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultConfig } from "../config/defaults.ts";
import { renderSearchBar } from "./search.ts";
import { SEARCH_ICONS } from "./search-icons.ts";
import type { AppContext } from "../layout/engine.ts";

function makeCtx(
  overrides: Partial<AppContext["config"]["search"]> = {},
  editMode = false,
): AppContext {
  const config = createDefaultConfig();
  config.search = { ...config.search, ...overrides };
  return {
    config,
    editMode,
    onConfigChange: vi.fn(),
  };
}

describe("search bar behavior", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("evaluates calculator on submit", () => {
    const root = renderSearchBar(makeCtx());
    const input = root.querySelector("#ks-search-input") as HTMLInputElement;
    input.value = "=2+2";
    root.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(input.value).toBe("4");
  });

  it("redirects bang queries on submit", () => {
    const root = renderSearchBar(makeCtx());
    const input = root.querySelector("#ks-search-input") as HTMLInputElement;
    input.value = "!gh kickstart";
    const event = new Event("submit", { cancelable: true });
    root.querySelector("form")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(window.location.href).toContain("github.com/search");
  });

  it("records search history on normal submit", () => {
    const root = renderSearchBar(makeCtx());
    const input = root.querySelector("#ks-search-input") as HTMLInputElement;
    input.value = "vitest docs";
    root.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(localStorage.getItem("kickstart:search-history")).toContain("vitest docs");
  });

  it("opens multiple tabs on shift+enter when enabled", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const root = renderSearchBar(makeCtx({ multiSearch: true }));
    const input = root.querySelector("#ks-search-input") as HTMLInputElement;
    input.value = "typescript";
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, cancelable: true }),
    );
    expect(open).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("includes icons for Hacker News and Stack Overflow presets", () => {
    expect(SEARCH_ICONS.hn).toBeTruthy();
    expect(SEARCH_ICONS.stackoverflow).toBeTruthy();
  });

  it("renders multi-search engine pickers in edit mode", () => {
    const root = renderSearchBar(makeCtx({ multiSearch: true, multiSearchEngines: ["ddg", "github"] }, true));
    expect(root.querySelector(".search-multi-engines")).toBeTruthy();
    expect(root.querySelectorAll(".search-multi-engines input[type=checkbox]").length).toBeGreaterThan(0);
  });

  it("uses dual-row stacked layout in edit mode", () => {
    const root = renderSearchBar(makeCtx({}, true));
    expect(root.classList.contains("search-bar--edit")).toBe(true);
    const form = root.querySelector("form");
    const panel = root.querySelector(".search-edit-panel");
    expect(form && panel).toBeTruthy();
    expect(root.firstElementChild).toBe(form);
    expect(root.lastElementChild).toBe(panel);
    const rows = panel!.querySelectorAll(".search-edit-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelector(".search-presets")).toBeTruthy();
    expect(rows[1]?.querySelector(".search-multi-section")).toBeTruthy();
  });

  it("exposes custom search configuration in edit mode", () => {
    const root = renderSearchBar(makeCtx({}, true));
    expect(root.querySelector(".search-custom-toggle")).toBeTruthy();
    expect(root.querySelector(".search-custom-panel")).toBeTruthy();
  });

  it("cycles history with arrow keys", () => {
    localStorage.clear();
    const root = renderSearchBar(makeCtx());
    const input = root.querySelector("#ks-search-input") as HTMLInputElement;
    input.value = "vitest docs";
    root.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true }));
    expect(input.value).toBe("vitest docs");
  });

  it("clears input when pressing up past most recent history", () => {
    const root = renderSearchBar(makeCtx());
    const input = root.querySelector("#ks-search-input") as HTMLInputElement;
    input.value = "first";
    root.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    input.value = "second";
    root.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
    input.value = "";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true }));
    expect(input.value).toBe("second");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true }));
    expect(input.value).toBe("");
  });
});
