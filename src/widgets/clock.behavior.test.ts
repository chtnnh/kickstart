import { describe, expect, it, vi } from "vitest";
import { createDefaultConfig } from "../config/defaults.ts";
import { renderClock } from "./clock.ts";
import type { AppContext } from "../layout/engine.ts";

function makeCtx(editMode = false): AppContext {
  const config = createDefaultConfig();
  config.widgets.push({
    id: "clock",
    type: "clock",
    enabled: true,
    layout: { zone: "top", align: "center", order: 1 },
    clock: { zones: [{ label: "home", timeZone: "Asia/Dubai" }], layout: "column" },
  });
  return { config, editMode, onConfigChange: vi.fn() };
}

describe("clock widget behavior", () => {
  it("shows layout label and select on one row in edit mode", () => {
    const root = renderClock(makeCtx(true), "clock");
    const toolbar = root.querySelector(".ks-clock-zone-toolbar");
    expect(toolbar).toBeTruthy();
    expect(toolbar?.querySelector(".ks-clock-layout-select")).toBeTruthy();
    expect(toolbar?.querySelector(".ks-clock-add-btn")).toBeTruthy();
  });

  it("uses an icon-only add timezone button", () => {
    const root = renderClock(makeCtx(true), "clock");
    const add = root.querySelector(".ks-clock-add-btn");
    expect(add?.getAttribute("aria-label")).toBe("Add timezone");
    expect(add?.textContent?.trim()).toBe("+");
  });
});
