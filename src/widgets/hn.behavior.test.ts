import { describe, expect, it, vi } from "vitest";
import { createDefaultConfig } from "../config/defaults.ts";
import { renderHn } from "./hn.ts";
import type { AppContext } from "../layout/engine.ts";

function makeCtx(): AppContext {
  const config = createDefaultConfig();
  config.widgets.push({
    id: "hn",
    type: "hn",
    enabled: true,
    layout: { zone: "main", align: "center", order: 1 },
  });
  return { config, editMode: false, onConfigChange: vi.fn() };
}

describe("hn widget behavior", () => {
  it("renders a centered-width root", () => {
    const root = renderHn(makeCtx(), "hn");
    expect(root.classList.contains("ks-hn")).toBe(true);
    expect(root.classList.contains("ks-hn--centered")).toBe(true);
  });

  it("renders header with Y logo and title", () => {
    const root = renderHn(makeCtx(), "hn");
    expect(root.querySelector(".ks-hn-logo")?.textContent).toBe("Y");
    expect(root.querySelector(".ks-hn-title")?.textContent).toBe("Hacker News");
  });

  it("shows loading placeholder before fetch completes", () => {
    const root = renderHn(makeCtx(), "hn");
    expect(root.querySelector(".ks-hn-loading")).toBeTruthy();
  });

  it("uses ordered list for stories", () => {
    const root = renderHn(makeCtx(), "hn");
    expect(root.querySelector("ol.ks-hn-list")).toBeTruthy();
  });
});
