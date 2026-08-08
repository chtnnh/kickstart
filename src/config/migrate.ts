import type { KickstartConfig } from "./types.ts";
import { createDefaultConfig } from "./defaults.ts";
import { resolvePresetId } from "../themes/presets.ts";

export function migrateToV2(raw: KickstartConfig): KickstartConfig {
  if (raw.v === "2") return raw;
  return {
    ...raw,
    v: "2",
    theme: {
      preset: raw.theme?.preset ?? "catppuccin",
      mode: "fixed",
      custom: raw.theme?.custom,
      themes: {},
    },
    appearance: {
      ...raw.appearance,
      fontSize: raw.appearance?.fontSize ?? "md",
    },
    privacy: {
      analytics: true,
      favicons: true,
      ...raw.privacy,
    },
  };
}

export function validateConfig(raw: unknown): KickstartConfig {
  const c = raw as KickstartConfig;
  if (!c || (c.v !== "1" && c.v !== "2")) throw new Error("Invalid config version");
  if (!c.search || !c.tree || !c.widgets) throw new Error("Missing required config fields");
  if (c.theme?.preset) {
    c.theme.preset = resolvePresetId(c.theme.preset);
  }
  const migrated = migrateToV2(c);
  if (!migrated.theme.mode) migrated.theme.mode = "fixed";
  if (!migrated.theme.themes) migrated.theme.themes = {};
  if (!migrated.privacy) migrated.privacy = { analytics: true, favicons: true };
  if (!migrated.search.multiSearchEngines?.length) {
    migrated.search.multiSearchEngines = ["ddg", "google", "github"];
  }
  return migrated;
}

export function createFreshConfig(): KickstartConfig {
  return validateConfig(createDefaultConfig());
}
