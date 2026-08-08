import { describe, expect, it } from "vitest";
import { createFreshConfig, migrateToV2, validateConfig } from "./migrate.ts";

describe("migrate", () => {
  it("migrates v1 config to v2", () => {
    const v1 = {
      v: "1" as const,
      search: { name: "ddg", url: "https://duckduckgo.com/?q=" },
      tree: { columns: [[{ cn: "a", b: [] }]] },
      theme: { preset: "monokai" },
      widgets: createFreshConfig().widgets,
    };
    const v2 = migrateToV2(v1);
    expect(v2.v).toBe("2");
    expect(v2.theme.mode).toBe("fixed");
    expect(v2.theme.preset).toBe("monokai");
    expect(v2.privacy?.favicons).toBe(true);
  });

  it("validates and resolves preset aliases", () => {
    const config = validateConfig({
      ...createFreshConfig(),
      theme: { preset: "monokai", mode: "fixed", themes: {} },
    });
    expect(config.theme.preset).toBe("MonokaiPro");
  });

  it("rejects invalid config version", () => {
    expect(() => validateConfig({ v: "3" })).toThrow(/Invalid config version/);
  });
});
