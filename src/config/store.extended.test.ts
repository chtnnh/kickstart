import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProfile,
  downloadConfig,
  exportConfigJson,
  getOrCreateConfig,
  listProfiles,
  loadConfig,
  loadMeta,
  markOnboarded,
  onConfigChange,
  saveConfig,
  switchProfile,
} from "./store.ts";
import { createDefaultConfig } from "./defaults.ts";
import { CONFIG_KEY, META_KEY } from "./types.ts";

describe("config store extended", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns default config when none stored", () => {
    expect(getOrCreateConfig().v).toBe("2");
  });

  it("debounces saves unless immediate", () => {
    const config = createDefaultConfig();
    saveConfig(config);
    expect(loadConfig()).toBeNull();
    vi.advanceTimersByTime(300);
    expect(loadConfig()?.search.name).toBe("ddg");
  });

  it("notifies config listeners on save", () => {
    const config = createDefaultConfig();
    const spy = vi.fn();
    const unsub = onConfigChange(spy);
    saveConfig(config, true);
    expect(spy).toHaveBeenCalledWith(config);
    unsub();
  });

  it("returns null for invalid stored config", () => {
    localStorage.setItem(`${CONFIG_KEY}:default`, "{bad json");
    expect(loadConfig()).toBeNull();
  });

  it("returns null when switching to unknown profile", () => {
    expect(switchProfile("missing")).toBeNull();
  });

  it("marks onboarding complete", () => {
    markOnboarded();
    expect(loadMeta().onboarded).toBe(true);
    expect(loadMeta().onboardedAt).toBeTruthy();
  });

  it("handles invalid meta JSON", () => {
    localStorage.setItem(META_KEY, "not-json");
    expect(loadMeta().activeProfile).toBe("default");
  });

  it("downloads config as JSON file", () => {
    const click = vi.fn();
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(document, "createElement").mockReturnValue({ click, href: "" } as HTMLAnchorElement);
    downloadConfig(createDefaultConfig());
    expect(click).toHaveBeenCalled();
    revoke.mockRestore();
    create.mockRestore();
  });

  it("creates profile without initial config", () => {
    createProfile("side");
    expect(listProfiles()).toContain("side");
    expect(loadMeta().activeProfile).toBe("side");
  });

  it("exports pretty-printed JSON", () => {
    expect(exportConfigJson(createDefaultConfig())).toContain('\n  "v"');
  });
});
