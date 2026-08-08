import { parse } from "./jsurl.ts";
import type { KickstartConfig } from "./types.ts";
import { defaultWidgets } from "./defaults.ts";
import { STARTTREE_THEME_ORDER, resolvePresetId } from "../themes/presets.ts";
import { validateConfig } from "./migrate.ts";

const STARTTREE_THEMES = [...STARTTREE_THEME_ORDER];

interface StartTreeConfig {
  s?: { n?: string; u?: string };
  t?: { nr?: number };
  v?: string;
  bmc?: Array<Array<{ cn: string; b: Array<{ n: string; u: string }> }>>;
}

export function migrateStartTreeUrl(url: string): KickstartConfig {
  let param: string | null = null;
  try {
    const u = new URL(url);
    param = u.searchParams.get("t");
  } catch {
    const match = url.match(/[?&]t=([^&]+)/);
    param = match ? decodeURIComponent(match[1]) : null;
  }
  if (!param) throw new Error("No StartTreeV2 config found in URL");
  return migrateStartTreeConfig(parse(param) as StartTreeConfig);
}

export function migrateStartTreeConfig(st: StartTreeConfig): KickstartConfig {
  const themeNr = (st.t as { nr?: number } | undefined)?.nr ?? 0;
  const presetName = STARTTREE_THEMES[themeNr] ?? "nord";

  return {
    v: "2",
    search: {
      name: st.s?.n ?? "ddg",
      url: st.s?.u ?? "https://duckduckgo.com/?q=",
    },
    tree: {
      columns: st.bmc ?? [[]],
    },
    theme: { preset: resolvePresetId(presetName), mode: "fixed", themes: {} },
    appearance: { background: { type: "none" }, fontSize: "md" },
    privacy: { analytics: true, favicons: true },
    widgets: defaultWidgets(),
    sync: { enabled: false },
  };
}

export function parseImportInput(input: string): KickstartConfig {
  const trimmed = input.trim();
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as KickstartConfig;
    return validateConfig(parsed);
  }
  if (trimmed.includes("?t=") || trimmed.startsWith("~(")) {
    return migrateStartTreeUrl(trimmed.startsWith("~(") ? `https://x/?t=${trimmed}` : trimmed);
  }
  throw new Error("Unrecognized import format");
}

