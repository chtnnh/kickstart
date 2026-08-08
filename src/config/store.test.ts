import { beforeEach, describe, expect, it } from "vitest";
import {
  createProfile,
  exportConfigJson,
  listProfiles,
  loadConfig,
  loadMeta,
  saveConfig,
  switchProfile,
} from "./store.ts";
import { createDefaultConfig } from "./defaults.ts";
import { CONFIG_KEY, META_KEY } from "./types.ts";

describe("config store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads config", () => {
    const config = createDefaultConfig();
    saveConfig(config, true);
    expect(loadConfig()?.search.name).toBe("ddg");
  });

  it("exports JSON", () => {
    const json = exportConfigJson(createDefaultConfig());
    expect(JSON.parse(json).v).toBe("2");
  });

  it("creates and switches profiles", () => {
    const base = createDefaultConfig();
    saveConfig(base, true);
    createProfile("work", { ...base, search: { ...base.search, name: "google", url: "https://google.com" } });
    expect(listProfiles()).toContain("work");
    const switched = switchProfile("work");
    expect(switched?.search.name).toBe("google");
    expect(loadMeta().activeProfile).toBe("work");
  });

  it("loads meta defaults", () => {
    expect(loadMeta().onboarded).toBe(false);
    localStorage.setItem(META_KEY, JSON.stringify({ onboarded: true }));
    expect(loadMeta().onboarded).toBe(true);
  });

  it("uses profile-specific storage keys", () => {
    localStorage.setItem(`${CONFIG_KEY}:work`, JSON.stringify({ ...createDefaultConfig(), search: { name: "work", url: "x" } }));
    createProfile("work");
    expect(loadConfig()?.search.name).toBe("work");
  });
});
