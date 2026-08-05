import type { KickstartConfig } from "../config/types.ts";
import { getPreset, type ThemeTokens } from "./presets.ts";
import type { StartTreePalette } from "./starttree-palettes.ts";

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

export function applyTheme(config: KickstartConfig): void {
  const preset = getPreset(config.theme.preset ?? "catppuccin");
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
}

export function applyBackground(config: KickstartConfig): void {
  const bg = document.getElementById("ks-background");
  if (!bg) return;

  const appearance = config.appearance?.background;
  if (!appearance || appearance.type === "none") {
    bg.style.background = "";
    bg.style.backdropFilter = "";
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
