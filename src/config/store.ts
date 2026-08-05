import type { KickstartConfig, KickstartMeta } from "./types.ts";
import { CONFIG_KEY, META_KEY } from "./types.ts";
import { createDefaultConfig } from "./defaults.ts";
import { validateConfig } from "./migrate-starttree.ts";

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(config: KickstartConfig) => void>();

export function loadConfig(): KickstartConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    return validateConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveConfig(config: KickstartConfig, immediate = false): void {
  const write = () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
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
    if (raw) return JSON.parse(raw) as KickstartMeta;
  } catch {
    /* ignore */
  }
  return { onboarded: false };
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
