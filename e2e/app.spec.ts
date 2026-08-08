import { test, expect } from "./fixtures.ts";

test.describe("kickstart app", () => {
  test("boots with search and tree", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#ks-search-input")).toBeVisible();
    await expect(page.locator(".tree-container")).toBeVisible();
  });

  test("focuses search with / shortcut", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await expect(page.locator("#ks-search-input")).toBeFocused();
  });

  test("opens settings overlay", async ({ page }) => {
    await page.goto("/");
    await page.locator(".ks-control--settings").click();
    await expect(page.locator(".ks-settings-overlay")).toBeVisible({ timeout: 10_000 });
  });

  test("opens settings overlay in edit mode", async ({ page }) => {
    await page.goto("/");
    await page.locator(".ks-control--edit").click();
    await expect(page.locator("body.ks-editing")).toBeVisible();
    await page.locator(".ks-control--settings").click();
    await expect(page.locator(".ks-settings-overlay")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".ks-settings-panel h2")).toHaveText("Settings");
  });

  test("edit mode bookmark rows stay compact", async ({ page }) => {
    await page.goto("/");
    await page.locator(".ks-control--edit").click();
    const row = page.locator(".bookmark-row").first();
    await expect(row).toBeVisible();
    const box = await row.boundingBox();
    expect(box?.height ?? 0).toBeLessThan(56);
  });

  test("centers tree in view mode", async ({ page }) => {
    await page.goto("/");
    const tree = page.locator(".tree-container");
    await expect(tree).toBeVisible();
    const box = await tree.boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport).toBeTruthy();
    const treeCenter = box!.x + box!.width / 2;
    const viewportCenter = viewport!.width / 2;
    expect(Math.abs(treeCenter - viewportCenter)).toBeLessThan(80);
  });

  test("imports JSON config from URL param", async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    const config = {
      v: "2",
      search: { name: "ddg", url: "https://duckduckgo.com/?q=" },
      tree: { columns: [[{ cn: "Imported", b: [{ n: "Example", u: "https://example.com" }] }]] },
      theme: { preset: "nord", mode: "fixed", themes: {} },
      appearance: { background: { type: "none" }, fontSize: "md" },
      privacy: { analytics: true, favicons: true },
      widgets: [
        { id: "search", type: "search", enabled: true, layout: { zone: "top", align: "center", order: 0 } },
        { id: "tree", type: "tree", enabled: true, layout: { zone: "main", align: "center", order: 0 } },
      ],
      sync: { enabled: false },
    };
    await page.goto(`/?import=${encodeURIComponent(JSON.stringify(config))}`);
    await expect(page.locator(".category-title", { hasText: "Imported" })).toBeVisible();
    await expect(page.locator('a.bookmark-link', { hasText: "Example" })).toHaveAttribute(
      "href",
      /example\.com/,
    );
  });

  test("toggles edit mode from control", async ({ page }) => {
    await page.goto("/");
    await page.locator(".ks-control--edit").click();
    await expect(page.locator("body.ks-editing")).toBeVisible();
    await expect(page.locator(".search-presets")).toBeVisible();
  });
});
