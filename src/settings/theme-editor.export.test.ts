import { describe, expect, it, vi } from "vitest";
import { themeExportFilename } from "./theme-editor.ts";
import { duplicatePaletteFromPreset } from "./theme-editor.ts";

describe("theme editor", () => {
  it("builds export filename from theme label", () => {
    const theme = { label: "My Cool Theme", palette: duplicatePaletteFromPreset("nord") };
    expect(themeExportFilename(theme)).toBe("kickstart-theme-my-cool-theme.json");
  });
});
