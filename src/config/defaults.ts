import type { KickstartConfig, WidgetConfig } from "./types.ts";

export function createDefaultConfig(): KickstartConfig {
  return {
    v: "2",
    search: {
      name: "ddg",
      url: "https://duckduckgo.com/?q=",
    },
    tree: {
      columns: [
        [
          {
            cn: "Welcome",
            b: [
              { n: "edit me", u: "" },
              { n: "add links", u: "" },
            ],
          },
          {
            cn: "Getting started",
            b: [
              { n: "click pencil to edit", u: "" },
              { n: "use arrows to reorder", u: "" },
            ],
          },
        ],
        [
          {
            cn: "kickstart",
            b: [
              { n: "your start page", u: "" },
              { n: "config stays local", u: "" },
            ],
          },
        ],
      ],
    },
    theme: { preset: "catppuccin", mode: "fixed", themes: {} },
    appearance: { background: { type: "none" }, fontSize: "md" },
    privacy: { analytics: true, favicons: true },
    widgets: defaultWidgets(),
    sync: { enabled: false },
  };
}

export function defaultWidgets(): WidgetConfig[] {
  return [
    {
      id: "search",
      type: "search",
      enabled: true,
      layout: { zone: "top", align: "center", order: 0 },
    },
    {
      id: "tree",
      type: "tree",
      enabled: true,
      layout: { zone: "main", align: "center", order: 0 },
    },
  ];
}

export function isDefaultEmpty(config: KickstartConfig | null): boolean {
  return config === null;
}
