import { describe, expect, it, vi } from "vitest";
import { getPreset, resolveActivePresetId, resolvePresetId } from "./presets.ts";
import { createDefaultConfig } from "../config/defaults.ts";

describe("theme presets", () => {
  it("resolves legacy aliases", () => {
    expect(resolvePresetId("monokai")).toBe("MonokaiPro");
  });

  it("includes high-contrast preset", () => {
    const preset = getPreset("high-contrast");
    expect(preset.id).toBe("high-contrast");
    expect(preset.palette.background).toBe("#000000");
  });

  it("uses system dark/light presets when mode is system", () => {
    const config = createDefaultConfig();
    config.theme.mode = "system";
    config.theme.systemDark = "catppuccin";
    config.theme.systemLight = "nord";
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }));
    expect(resolveActivePresetId(config)).toBe("catppuccin");
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
    expect(resolveActivePresetId(config)).toBe("nord");
    vi.unstubAllGlobals();
  });

  it("falls back to fixed preset when mode is fixed", () => {
    const config = createDefaultConfig();
    config.theme.mode = "fixed";
    config.theme.preset = "nord";
    expect(resolveActivePresetId(config)).toBe("nord");
  });
});
