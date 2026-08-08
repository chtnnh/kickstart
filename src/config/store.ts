import type { KickstartConfig, KickstartMeta } from "./types.ts";
import { META_KEY, configStorageKey } from "./types.ts";
import { createDefaultConfig } from "./defaults.ts";
import { validateConfig } from "./migrate.ts";

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(config: KickstartConfig) => void>();

export function loadConfig(): KickstartConfig | null {
  try {
    const meta = loadMeta();
    const key = configStorageKey(meta.activeProfile ?? "default");
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return validateConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveConfig(config: KickstartConfig, immediate = false): void {
  const write = () => {
    const meta = loadMeta();
    const key = configStorageKey(meta.activeProfile ?? "default");
    localStorage.setItem(key, JSON.stringify(config));
    listeners.forEach((fn) => fn(config));
  };
  if (immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    write();
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(write, 300);
}

export function getOrCreateConfig(): KickstartConfig {
  return loadConfig() ?? createDefaultConfig();
}

export function loadMeta(): KickstartMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const meta = JSON.parse(raw) as KickstartMeta;
      meta.activeProfile ??= "default";
      meta.profiles ??= ["default"];
      return meta;
    }
  } catch {
    /* ignore */
  }
  return { onboarded: false, activeProfile: "default", profiles: ["default"] };
}

export function listProfiles(): string[] {
  return loadMeta().profiles ?? ["default"];
}

export function switchProfile(profileId: string): KickstartConfig | null {
  const meta = loadMeta();
  if (!meta.profiles?.includes(profileId)) return null;
  saveMeta({ ...meta, activeProfile: profileId });
  return loadConfig();
}

export function createProfile(profileId: string, config?: KickstartConfig): void {
  const meta = loadMeta();
  const profiles = meta.profiles ?? ["default"];
  if (!profiles.includes(profileId)) profiles.push(profileId);
  saveMeta({ ...meta, profiles, activeProfile: profileId });
  if (config) {
    localStorage.setItem(configStorageKey(profileId), JSON.stringify(validateConfig(config)));
  }
}

export function saveMeta(meta: KickstartMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function markOnboarded(): void {
  saveMeta({ onboarded: true, onboardedAt: new Date().toISOString() });
}

export function onConfigChange(fn: (config: KickstartConfig) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function exportConfigJson(config: KickstartConfig): string {
  return JSON.stringify(config, null, 2);
}

export function downloadConfig(config: KickstartConfig): void {
  const blob = new Blob([exportConfigJson(config)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kickstart-config.json";
  a.click();
  URL.revokeObjectURL(a.href);
}
