import type { StartTreePalette } from "../themes/starttree-palettes.ts";

export type LayoutZone = "top" | "above-tree" | "main" | "below-tree" | "bottom";

export interface WidgetLayout {
  zone: LayoutZone;
  align: "start" | "center" | "end";
  order: number;
}

export interface Bookmark {
  n: string;
  u: string;
}

export interface BookmarkCategory {
  cn: string;
  b: Bookmark[];
}

export type BookmarkColumn = BookmarkCategory[];

export interface CustomTheme {
  label: string;
  palette: StartTreePalette;
}

export interface WidgetConfig {
  id: string;
  type: "tree" | "search" | "clock" | "quote" | "spacer" | "pomodoro" | "note" | "hn";
  enabled: boolean;
  layout: WidgetLayout;
  quote?: { text?: string; source?: "random" | "fixed" };
  clock?: {
    format?: "12h" | "24h";
    showSeconds?: boolean;
    layout?: "row" | "column";
    zones?: Array<{ label: string; timeZone: string }>;
  };
  spacer?: { size?: "sm" | "md" | "lg" };
  note?: { text?: string };
  pomodoro?: { workMin?: number; breakMin?: number };
  hn?: { count?: number };
}

export interface KickstartConfig {
  v: "1" | "2";
  search: { name: string; url: string; label?: string; multiSearch?: boolean; multiSearchEngines?: string[] };
  tree: { columns: BookmarkColumn[] };
  theme: {
    preset?: string;
    mode?: "fixed" | "system";
    systemDark?: string;
    systemLight?: string;
    custom?: Record<string, string>;
    themes?: Record<string, CustomTheme>;
  };
  appearance?: {
    background?: {
      type: "none" | "color" | "gradient" | "image";
      value?: string;
      blur?: number;
      overlay?: string;
    };
    font?: string;
    fontSize?: "sm" | "md" | "lg";
  };
  privacy?: {
    analytics?: boolean;
    favicons?: boolean;
  };
  widgets: WidgetConfig[];
  sync?: {
    enabled: boolean;
    syncId?: string;
  };
}

export interface KickstartMeta {
  onboarded: boolean;
  onboardedAt?: string;
  activeProfile?: string;
  profiles?: string[];
}

export const CONFIG_KEY = "kickstart:config";
export const META_KEY = "kickstart:meta";

export const LAYOUT_ZONES: LayoutZone[] = [
  "top",
  "above-tree",
  "main",
  "below-tree",
  "bottom",
];

export function configStorageKey(profileId = "default"): string {
  return profileId === "default" ? CONFIG_KEY : `${CONFIG_KEY}:${profileId}`;
}
