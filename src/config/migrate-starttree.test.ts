import { describe, expect, it } from "vitest";
import { migrateStartTreeConfig, parseImportInput } from "./migrate-starttree.ts";
import { stringify } from "./jsurl.ts";

describe("migrate-starttree", () => {
  it("maps theme index to preset id", () => {
    const config = migrateStartTreeConfig({
      s: { n: "google", u: "https://www.google.com/search?q=" },
      t: { nr: 0 },
      bmc: [[{ cn: "Dev", b: [{ n: "GitHub", u: "https://github.com" }] }]],
    });
    expect(config.v).toBe("2");
    expect(config.theme.preset).toBe("black-ice");
    expect(config.search.name).toBe("google");
    expect(config.tree.columns[0]![0]!.cn).toBe("Dev");
  });

  it("imports JSURL from URL param", () => {
    const payload = stringify({
      s: { n: "ddg", u: "https://duckduckgo.com/?q=" },
      t: { nr: 27 },
      bmc: [[{ cn: "Links", b: [{ n: "x", u: "https://x.com" }] }]],
    });
    const config = parseImportInput(`https://example.com/?t=${encodeURIComponent(payload!)}`);
    expect(config.theme.preset).toBe("catppuccin");
    expect(config.tree.columns[0]![0]!.b[0]!.u).toBe("https://x.com");
  });

  it("imports JSON config", () => {
    const fresh = migrateStartTreeConfig({ t: { nr: 1 } });
    const config = parseImportInput(JSON.stringify(fresh));
    expect(config.v).toBe("2");
  });
});
