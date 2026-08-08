import { STARTTREE_PALETTES, type StartTreePalette } from "./starttree-palettes.ts";
import type { CustomTheme, KickstartConfig } from "../config/types.ts";

export interface ThemeTokens {
  "--ks-bg": string;
  "--ks-fg": string;
  "--ks-accent": string;
  "--ks-prompt": string;
  "--ks-prompt-dim": string;
  "--ks-link": string;
  "--ks-link-hover": string;
  "--ks-widget-fg": string;
  "--ks-widget-muted": string;
  "--ks-widget-accent": string;
  "--ks-widget-border": string;
  "--ks-widget-shadow": string;
  "--ks-bg-overlay": string;
}

export interface ThemePreset {
  id: string;
  name: string;
  palette: StartTreePalette;
  tokens: ThemeTokens;
}

/** Theme order matches AlexW00/StartTreeV2 theme changer. */
export const STARTTREE_THEME_ORDER = [
  "black-ice",
  "carnival",
  "cotton-candy",
  "desert-sky",
  "ferns",
  "forest",
  "gruvbox",
  "intrigue",
  "just-red",
  "neon-pink-dark",
  "neon",
  "orange-dark",
  "slick-red",
  "this-ones-good",
  "tomorrow-night-eighties",
  "void",
  "water-fire",
  "storm",
  "gold-hunter",
  "sierra",
  "capitane",
  "bigsur",
  "monterey",
  "nord",
  "MonokaiPro",
  "Programiz",
  "autumn-mech",
  "catppuccin",
  "high-contrast",
] as const;

/** Legacy kickstart preset ids → StartTreeV2 theme file names. */
const PRESET_ALIASES: Record<string, string> = {
  monokai: "MonokaiPro",
  "tomorrow-night": "tomorrow-night-eighties",
};

function overlay(bg: string): string {
  if (bg.startsWith("#") && bg.length === 7) {
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.55)`;
  }
  return "rgba(0, 0, 0, 0.55)";
}

function tokensFromPalette(p: StartTreePalette, widgetShadow = "none"): ThemeTokens {
  return {
    "--ks-bg": p.background,
    "--ks-fg": p.foreground,
    "--ks-accent": p.color12,
    "--ks-prompt": p.color5,
    "--ks-prompt-dim": p.color8,
    "--ks-link": p.color6,
    "--ks-link-hover": p.color12,
    "--ks-widget-fg": p.foreground,
    "--ks-widget-muted": p.color8,
    "--ks-widget-accent": p.color10,
    "--ks-widget-border": `color-mix(in srgb, ${p.foreground} 12%, transparent)`,
    "--ks-widget-shadow": widgetShadow,
    "--ks-bg-overlay": overlay(p.background),
  };
}

function themeDisplayName(id: string): string {
  if (id === "MonokaiPro") return "Monokai Pro";
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function preset(id: string, name: string, widgetShadow = "none"): ThemePreset {
  const palette = STARTTREE_PALETTES[id]!;
  return { id, name, palette, tokens: tokensFromPalette(palette, widgetShadow) };
}

export const THEME_PRESETS: ThemePreset[] = STARTTREE_THEME_ORDER.map((id) =>
  preset(id, themeDisplayName(id), id === "neon" ? "0 0 8px rgba(198, 16, 190, 0.2)" : "none"),
);

export function resolvePresetId(id: string): string {
  return PRESET_ALIASES[id] ?? id;
}

export function getPreset(id: string, customThemes?: Record<string, CustomTheme>): ThemePreset {
  const resolved = resolvePresetId(id);
  const custom = customThemes?.[resolved];
  if (custom) {
    return {
      id: resolved,
      name: custom.label,
      palette: custom.palette,
      tokens: tokensFromPalette(custom.palette),
    };
  }
  return THEME_PRESETS.find((p) => p.id === resolved) ?? THEME_PRESETS.find((p) => p.id === "catppuccin")!;
}

export function resolveActivePresetId(config: KickstartConfig): string {
  if (config.theme.mode === "system") {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark
      ? (config.theme.systemDark ?? config.theme.preset ?? "catppuccin")
      : (config.theme.systemLight ?? config.theme.preset ?? "nord");
  }
  return config.theme.preset ?? "catppuccin";
}

export function listThemeOptions(config: KickstartConfig): Array<{ id: string; name: string }> {
  const builtins = THEME_PRESETS.map((p) => ({ id: p.id, name: p.name }));
  const custom = Object.entries(config.theme.themes ?? {}).map(([id, t]) => ({
    id,
    name: t.label,
  }));
  return [...builtins, ...custom];
}
