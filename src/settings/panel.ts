import type { KickstartConfig } from "../config/types.ts";
import { downloadConfig, exportConfigJson } from "../config/store.ts";
import { parseImportInput } from "../config/migrate-starttree.ts";
import { THEME_PRESETS } from "../themes/presets.ts";
import { encryptConfig, generateSyncId, decryptConfig } from "../sync/crypto.ts";
import { pushSync, pullSync } from "../sync/client.ts";
import { showWelcome } from "../onboarding/welcome.ts";
import { getSystemClockFormat } from "../widgets/clock.ts";

export interface SettingsCallbacks {
  onConfigChange: (config: KickstartConfig) => void;
  onClose: () => void;
  onShowWelcome: () => void;
}

export function openSettings(config: KickstartConfig, callbacks: SettingsCallbacks): void {
  const overlay = document.createElement("div");
  overlay.className = "ks-settings-overlay";
  overlay.innerHTML = buildSettingsHtml(config);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    callbacks.onClose();
  };

  overlay.querySelector(".ks-settings-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const panel = overlay.querySelector(".ks-settings-panel");
  panel?.addEventListener("click", (e) => e.stopPropagation());

  bindSettings(overlay, config, callbacks, close);

  overlay.querySelectorAll(".ks-settings-group").forEach((group) => {
    group.addEventListener("toggle", () => {
      if ((group as HTMLDetailsElement).open) {
        overlay.querySelectorAll(".ks-settings-group").forEach((other) => {
          if (other !== group) (other as HTMLDetailsElement).open = false;
        });
      }
    });
  });
}

function bindSettings(
  overlay: HTMLElement,
  config: KickstartConfig,
  callbacks: SettingsCallbacks,
  close: () => void,
): void {
  overlay.querySelector("#ks-theme-select")?.addEventListener("change", (e) => {
    config.theme.preset = (e.target as HTMLSelectElement).value;
    callbacks.onConfigChange(config);
  });

  overlay.querySelector("#ks-custom-accent")?.addEventListener("input", (e) => {
    config.theme.custom ??= {};
    config.theme.custom["--ks-accent"] = (e.target as HTMLInputElement).value;
    callbacks.onConfigChange(config);
  });

  overlay.querySelector("#ks-bg-type")?.addEventListener("change", (e) => {
    const type = (e.target as HTMLSelectElement).value as "none" | "color" | "gradient" | "image";
    config.appearance ??= { background: { type: "none" } };
    config.appearance.background = { type, value: config.appearance.background?.value };
    callbacks.onConfigChange(config);
    const valueRow = overlay.querySelector("#ks-bg-value-row") as HTMLElement;
    if (valueRow) valueRow.hidden = type === "none";
  });

  overlay.querySelector("#ks-bg-value")?.addEventListener("input", (e) => {
    config.appearance ??= { background: { type: "color" } };
    config.appearance.background ??= { type: "color" };
    config.appearance.background.value = (e.target as HTMLInputElement).value;
    callbacks.onConfigChange(config);
  });

  overlay.querySelector("#ks-add-search")?.addEventListener("click", () => {
    if (!config.widgets.find((w) => w.type === "search")) {
      const topCount = config.widgets.filter((w) => w.enabled && w.layout.zone === "top").length;
      config.widgets.push({
        id: "search",
        type: "search",
        enabled: true,
        layout: { zone: "top", align: "center", order: topCount },
      });
      callbacks.onConfigChange(config);
      toast("Search added");
    }
  });

  overlay.querySelector("#ks-add-clock")?.addEventListener("click", () => {
    if (!config.widgets.find((w) => w.type === "clock")) {
      config.widgets.push({
        id: "clock",
        type: "clock",
        enabled: true,
        layout: { zone: "top", align: "center", order: 1 },
        clock: { format: getSystemClockFormat() },
      });
      callbacks.onConfigChange(config);
      toast("Clock added — click it in edit mode to toggle 12h/24h");
    }
  });

  overlay.querySelector("#ks-add-quote")?.addEventListener("click", () => {
    if (!config.widgets.find((w) => w.type === "quote")) {
      config.widgets.push({
        id: "quote",
        type: "quote",
        enabled: true,
        layout: { zone: "above-tree", align: "center", order: 0 },
        quote: { source: "random" },
      });
      callbacks.onConfigChange(config);
      toast("Quote added");
    }
  });

  overlay.querySelector("#ks-export")?.addEventListener("click", () => downloadConfig(config));
  overlay.querySelector("#ks-copy-json")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(exportConfigJson(config));
    toast("Copied to clipboard");
  });

  overlay.querySelector("#ks-import-settings")?.addEventListener("click", () => {
    const text = (overlay.querySelector("#ks-import-settings-text") as HTMLTextAreaElement).value;
    try {
      Object.assign(config, parseImportInput(text));
      callbacks.onConfigChange(config);
      toast("Imported successfully");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import failed", true);
    }
  });

  overlay.querySelector("#ks-show-welcome")?.addEventListener("click", () => {
    close();
    showWelcome({
      onReady: callbacks.onConfigChange,
      allowDismiss: true,
      onDismiss: () => {
        /* config unchanged */
      },
    });
  });

  overlay.querySelector("#ks-sync-enable")?.addEventListener("click", async () => {
    const passphrase = (overlay.querySelector("#ks-sync-passphrase") as HTMLInputElement).value;
    if (!passphrase) return toast("Enter a passphrase first", true);
    config.sync ??= { enabled: false };
    if (!config.sync.syncId) config.sync.syncId = generateSyncId();
    config.sync.enabled = true;
    try {
      await pushSync(config.sync.syncId, await encryptConfig(exportConfigJson(config), passphrase));
      const idEl = overlay.querySelector("#ks-sync-id-display");
      if (idEl) idEl.textContent = config.sync.syncId;
      toast("Synced to cloud");
      callbacks.onConfigChange(config);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Sync failed", true);
    }
  });

  overlay.querySelector("#ks-sync-pull")?.addEventListener("click", async () => {
    const syncId = (overlay.querySelector("#ks-sync-id-input") as HTMLInputElement).value.trim();
    const passphrase = (overlay.querySelector("#ks-sync-passphrase") as HTMLInputElement).value;
    try {
      const blob = await pullSync(syncId);
      if (!blob) throw new Error("No config found");
      Object.assign(config, JSON.parse(await decryptConfig(blob, passphrase)));
      callbacks.onConfigChange(config);
      toast("Restored from cloud");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Restore failed", true);
    }
  });
}

function buildSettingsHtml(config: KickstartConfig): string {
  const themeOptions = THEME_PRESETS.map(
    (p) => `<option value="${p.id}" ${config.theme.preset === p.id ? "selected" : ""}>${p.name}</option>`,
  ).join("");

  const bgType = config.appearance?.background?.type ?? "none";
  const bgValue = config.appearance?.background?.value ?? "";
  const accent = config.theme.custom?.["--ks-accent"] ?? "#89b4fa";

  return `
    <div class="ks-settings-panel">
      <header class="ks-settings-header">
        <h2>Settings</h2>
        <button class="ks-settings-close" aria-label="Close">×</button>
      </header>

      <div class="ks-settings-body">
        <details class="ks-settings-group" open>
          <summary>Appearance</summary>
          <div class="ks-settings-group-body">
            <div class="ks-settings-group-inner">
          <div class="ks-settings-grid">
            <label class="ks-field">
              <span>Theme</span>
              <select id="ks-theme-select">${themeOptions}</select>
            </label>
            <label class="ks-field ks-field--row">
              <span>Accent</span>
              <input id="ks-custom-accent" type="color" value="${accent}" />
            </label>
            <label class="ks-field">
              <span>Background</span>
              <select id="ks-bg-type">
                <option value="none" ${bgType === "none" ? "selected" : ""}>None</option>
                <option value="color" ${bgType === "color" ? "selected" : ""}>Color</option>
                <option value="gradient" ${bgType === "gradient" ? "selected" : ""}>Gradient</option>
                <option value="image" ${bgType === "image" ? "selected" : ""}>Image URL</option>
              </select>
            </label>
            <label class="ks-field" id="ks-bg-value-row" ${bgType === "none" ? "hidden" : ""}>
              <span>Value</span>
              <input id="ks-bg-value" type="text" placeholder="#1e1e2e or url(...)" value="${escapeAttr(bgValue)}" />
            </label>
          </div>
            </div>
          </div>
        </details>

        <details class="ks-settings-group">
          <summary>Widgets</summary>
          <div class="ks-settings-group-body">
            <div class="ks-settings-group-inner">
          <div class="ks-settings-actions">
            <button id="ks-add-search" class="ks-btn">+ Search</button>
            <button id="ks-add-clock" class="ks-btn">+ Clock</button>
            <button id="ks-add-quote" class="ks-btn">+ Quote</button>
          </div>
          <p class="ks-settings-hint">Use the arrow controls in edit mode to move widgets. The tree cannot be removed.</p>
            </div>
          </div>
        </details>

        <details class="ks-settings-group">
          <summary>Import / Export</summary>
          <div class="ks-settings-group-body">
            <div class="ks-settings-group-inner">
          <div class="ks-settings-actions">
            <button id="ks-export" class="ks-btn">Download JSON</button>
            <button id="ks-copy-json" class="ks-btn">Copy JSON</button>
          </div>
          <textarea id="ks-import-settings-text" class="ks-settings-textarea" rows="3" placeholder="Paste JSON or StartTreeV2 URL"></textarea>
          <button id="ks-import-settings" class="ks-btn ks-btn--primary ks-btn--block">Import</button>
            </div>
          </div>
        </details>

        <details class="ks-settings-group">
          <summary>Cloud sync</summary>
          <div class="ks-settings-group-body">
            <div class="ks-settings-group-inner">
          <p class="ks-settings-hint">End-to-end encrypted. Server never sees your config.</p>
          <label class="ks-field">
            <span>Passphrase</span>
            <input id="ks-sync-passphrase" type="password" placeholder="Your sync passphrase" />
          </label>
          <div class="ks-settings-actions">
            <button id="ks-sync-enable" class="ks-btn ks-btn--primary">Push to cloud</button>
            <button id="ks-sync-pull" class="ks-btn">Pull from cloud</button>
          </div>
          <p class="ks-settings-hint">Sync ID: <code id="ks-sync-id-display">${config.sync?.syncId ?? "—"}</code></p>
          <label class="ks-field">
            <span>Restore ID</span>
            <input id="ks-sync-id-input" type="text" placeholder="Paste sync ID" />
          </label>
            </div>
          </div>
        </details>

        <div class="ks-settings-footer">
          <button id="ks-show-welcome" class="ks-btn ks-btn--ghost">Show welcome again</button>
        </div>
      </div>
    </div>
  `;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

function toast(msg: string, isError = false): void {
  const el = document.createElement("div");
  el.className = `ks-toast${isError ? " ks-toast--error" : ""}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
