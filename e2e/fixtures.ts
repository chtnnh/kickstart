import { test as base, expect } from "@playwright/test";

const SEED_CONFIG = {
  v: "2",
  search: { name: "ddg", url: "https://duckduckgo.com/?q=" },
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
      ],
    ],
  },
  theme: { preset: "catppuccin", mode: "fixed", themes: {} },
  appearance: { background: { type: "none" }, fontSize: "md" },
  privacy: { analytics: true, favicons: true },
  widgets: [
    { id: "search", type: "search", enabled: true, layout: { zone: "top", align: "center", order: 0 } },
    { id: "tree", type: "tree", enabled: true, layout: { zone: "main", align: "center", order: 0 } },
  ],
  sync: { enabled: false },
};

const SEED_META = { onboarded: true, activeProfile: "default", profiles: ["default"] };

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ({ config, meta }) => {
        localStorage.setItem("kickstart:config", JSON.stringify(config));
        localStorage.setItem("kickstart:meta", JSON.stringify(meta));
      },
      { config: SEED_CONFIG, meta: SEED_META },
    );
    await use(page);
  },
});

export { expect };
