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

export interface WidgetConfig {
  id: string;
  type: "tree" | "search" | "clock" | "quote" | "spacer";
  enabled: boolean;
  layout: WidgetLayout;
  quote?: { text?: string; source?: "random" | "fixed" };
  clock?: { format?: "12h" | "24h"; showSeconds?: boolean };
  spacer?: { size?: "sm" | "md" | "lg" };
}

export interface KickstartConfig {
  v: "1";
  search: { name: string; url: string; label?: string };
  tree: { columns: BookmarkColumn[] };
  theme: {
    preset?: string;
    custom?: Record<string, string>;
  };
  appearance?: {
    background?: {
      type: "none" | "color" | "gradient" | "image";
      value?: string;
      blur?: number;
      overlay?: string;
    };
    font?: string;
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
