import type { KickstartConfig } from "../config/types.ts";
import { getPreset, resolveActivePresetId, type ThemeTokens } from "./presets.ts";
import type { StartTreePalette } from "./starttree-palettes.ts";

let systemThemeListener: (() => void) | null = null;

function applyStartTreePalette(root: HTMLElement, palette: StartTreePalette): void {
  root.style.setProperty("--background", palette.background);
  root.style.setProperty("--foreground", palette.foreground);
  root.style.setProperty("--cursor", palette.cursor);

  for (let i = 0; i <= 15; i++) {
    const key = `color${i}` as keyof StartTreePalette;
    root.style.setProperty(`--color${i}`, palette[key]);
  }

  root.style.setProperty("--branch", `1px solid ${palette.color12}`);
}

function updateThemeColorMeta(bg: string): void {
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = bg;
}

function applyFontSize(root: HTMLElement, size?: "sm" | "md" | "lg"): void {
  const scale = size === "sm" ? "0.9" : size === "lg" ? "1.1" : "1";
  root.style.setProperty("--ks-font-scale", scale);
}

export function applyTheme(config: KickstartConfig): void {
  const presetId = resolveActivePresetId(config);
  const preset = getPreset(presetId, config.theme.themes);
  const tokens: ThemeTokens = { ...preset.tokens };

  if (config.theme.custom) {
    Object.assign(tokens, config.theme.custom);
  }

  const root = document.documentElement;

  applyStartTreePalette(root, preset.palette);

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }

  if (config.appearance?.font) {
    root.style.setProperty("--font", config.appearance.font);
  }

  applyFontSize(root, config.appearance?.fontSize);
  updateThemeColorMeta(preset.palette.background);
  root.style.colorScheme = isColorDark(preset.palette.background) ? "dark" : "light";
}

function isColorDark(hex: string): boolean {
  if (!hex.startsWith("#") || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function watchSystemTheme(onChange: () => void): () => void {
  if (systemThemeListener) {
    window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", systemThemeListener);
  }
  systemThemeListener = onChange;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onChange);
  return () => {
    if (systemThemeListener) {
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", systemThemeListener);
      systemThemeListener = null;
    }
  };
}

export function applyBackground(config: KickstartConfig): void {
  const bg = document.getElementById("ks-background");
  if (!bg) return;

  const appearance = config.appearance?.background;
  if (!appearance || appearance.type === "none") {
    bg.style.background = "";
    bg.style.backdropFilter = "";
    bg.style.boxShadow = "";
    return;
  }

  switch (appearance.type) {
    case "color":
      bg.style.background = appearance.value ?? "var(--ks-bg)";
      break;
    case "gradient":
      bg.style.background = appearance.value ?? "";
      break;
    case "image":
      bg.style.backgroundImage = `url(${appearance.value ?? ""})`;
      bg.style.backgroundSize = "cover";
      bg.style.backgroundPosition = "center";
      break;
  }

  if (appearance.blur) {
    bg.style.backdropFilter = `blur(${appearance.blur}px)`;
  }

  if (appearance.overlay) {
    bg.style.boxShadow = `inset 0 0 0 100vmax ${appearance.overlay}`;
  }
}
