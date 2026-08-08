import type { StartTreePalette } from "../themes/starttree-palettes.ts";
import type { CustomTheme } from "../config/types.ts";
import { getPreset } from "../themes/presets.ts";

export const PALETTE_KEYS: Array<keyof StartTreePalette> = [
  "background",
  "foreground",
  "cursor",
  "color0",
  "color1",
  "color2",
  "color3",
  "color4",
  "color5",
  "color6",
  "color7",
  "color8",
  "color9",
  "color10",
  "color11",
  "color12",
  "color13",
  "color14",
  "color15",
];

export function duplicatePaletteFromPreset(presetId: string): StartTreePalette {
  return { ...getPreset(presetId).palette };
}

export function createCustomThemeId(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `custom-${base || "theme"}-${Date.now().toString(36).slice(-4)}`;
}

export function slugifyThemeLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "theme"
  );
}

export function themeExportFilename(theme: CustomTheme): string {
  return `kickstart-theme-${slugifyThemeLabel(theme.label)}.json`;
}

export function exportThemeJson(id: string, theme: CustomTheme): string {
  return JSON.stringify({ id, ...theme }, null, 2);
}

export function parseThemeImport(raw: string): { id: string; theme: CustomTheme } {
  const parsed = JSON.parse(raw) as { id?: string; label: string; palette: StartTreePalette };
  if (!parsed.label || !parsed.palette) throw new Error("Invalid theme JSON");
  const id = parsed.id ?? createCustomThemeId(parsed.label);
  return { id, theme: { label: parsed.label, palette: parsed.palette } };
}
