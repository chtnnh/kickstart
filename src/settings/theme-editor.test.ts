import { describe, expect, it } from "vitest";
import {
  createCustomThemeId,
  duplicatePaletteFromPreset,
  exportThemeJson,
  parseThemeImport,
} from "./theme-editor.ts";

describe("theme editor", () => {
  it("duplicates palette from preset", () => {
    const palette = duplicatePaletteFromPreset("nord");
    expect(palette.background).toBeTruthy();
    expect(palette.color0).toBeTruthy();
  });

  it("creates stable custom theme ids", () => {
    expect(createCustomThemeId("My Theme")).toMatch(/^custom-my-theme-/);
  });

  it("round-trips theme JSON import/export", () => {
    const palette = duplicatePaletteFromPreset("catppuccin");
    const theme = { label: "Test", palette };
    const json = exportThemeJson("custom-test", theme);
    const imported = parseThemeImport(json);
    expect(imported.id).toBe("custom-test");
    expect(imported.theme.label).toBe("Test");
    expect(imported.theme.palette.background).toBe(palette.background);
  });

  it("rejects invalid import JSON", () => {
    expect(() => parseThemeImport("{}")).toThrow(/Invalid theme JSON/);
  });
});
