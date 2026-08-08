import { describe, expect, it, vi } from "vitest";
import { createDefaultConfig } from "../config/defaults.ts";
import type { AppContext } from "../layout/engine.ts";
import { renderClock } from "./clock.ts";

function makeCtx(editMode: boolean, zoneCount: number): AppContext {
  const config = createDefaultConfig();
  const zones = Array.from({ length: zoneCount }, (_, i) => ({
    label: `z${i}`,
    timeZone: "UTC",
  }));
  config.widgets.push({
    id: "clock",
    type: "clock",
    enabled: true,
    layout: { zone: "top", align: "center", order: 1 },
    clock: { zones, layout: "row" },
  });
  return { config, editMode, onConfigChange: vi.fn() };
}

describe("clock zones layout", () => {
  it("wraps clocks in a zones container", () => {
    const root = renderClock(makeCtx(false, 2), "clock");
    expect(root.querySelector(".ks-clock-zones")).toBeTruthy();
    expect(root.querySelectorAll(".ks-clock-block")).toHaveLength(2);
  });

  it("keeps toolbar outside zones container in edit mode", () => {
    const root = renderClock(makeCtx(true, 3), "clock");
    const zones = root.querySelector(".ks-clock-zones");
    const toolbar = root.querySelector(".ks-clock-zone-toolbar");
    expect(zones?.contains(toolbar!)).toBe(false);
    expect(zones?.querySelectorAll(".ks-clock-block")).toHaveLength(3);
  });

  it("applies row layout class on wrap", () => {
    const root = renderClock(makeCtx(false, 1), "clock");
    expect(root.classList.contains("ks-clock-wrap--row")).toBe(true);
  });
});
