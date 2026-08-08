import type { KickstartConfig } from "../config/types.ts";
import {
  downloadConfig,
  exportConfigJson,
  listProfiles,
  switchProfile,
  createProfile,
  loadMeta,
  loadConfig,
} from "../config/store.ts";
import { parseImportInput } from "../config/migrate-starttree.ts";
import { parseBookmarkHtml, treeToMarkdown } from "../tree/bookmark-import.ts";
import { getSystemClockFormat } from "../widgets/clock.ts";
import { buildThemeEditorHtml, bindThemeEditor } from "./theme-editor-ui.ts";
import { showToast } from "../lib/toast.ts";
import { canInstallPwa, promptPwaInstall } from "../lib/pwa-install.ts";

export interface SettingsCallbacks {
  onConfigChange: (config: KickstartConfig, opts?: { relayout?: boolean }) => void;
  onClose: () => void;
  onShowWelcome: () => void;
}

export function openSettings(config: KickstartConfig, callbacks: SettingsCallbacks): void {
  if (document.querySelector(".ks-settings-overlay")) return;

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
  const change = (relayout = false) => callbacks.onConfigChange(config, { relayout });

  bindThemeEditor(overlay, config, () => change(false));

  overlay.querySelector("#ks-custom-accent")?.addEventListener("input", (e) => {
    config.theme.custom ??= {};
    config.theme.custom["--ks-accent"] = (e.target as HTMLInputElement).value;
    change(false);
  });

  overlay.querySelector("#ks-bg-type")?.addEventListener("change", (e) => {
    const type = (e.target as HTMLSelectElement).value as "none" | "color" | "gradient" | "image";
    config.appearance ??= { background: { type: "none" } };
    config.appearance.background = { type, value: config.appearance.background?.value };
    const valueRow = overlay.querySelector("#ks-bg-value-row") as HTMLElement;
    if (valueRow) valueRow.hidden = type === "none";
    change(false);
  });

  overlay.querySelector("#ks-bg-value")?.addEventListener("input", (e) => {
    config.appearance ??= { background: { type: "color" } };
    config.appearance.background ??= { type: "color" };
    config.appearance.background.value = (e.target as HTMLInputElement).value;
    change(false);
  });

  overlay.querySelector("#ks-privacy-analytics")?.addEventListener("change", (e) => {
    config.privacy ??= { analytics: true, favicons: true };
    config.privacy.analytics = (e.target as HTMLInputElement).checked;
    change(false);
  });

  overlay.querySelector("#ks-privacy-favicons")?.addEventListener("change", (e) => {
    config.privacy ??= { analytics: true, favicons: true };
    config.privacy.favicons = (e.target as HTMLInputElement).checked;
    change(true);
  });

  overlay.querySelector("#ks-profile-select")?.addEventListener("change", (e) => {
    const id = (e.target as HTMLSelectElement).value;
    const next = switchProfile(id);
    if (next) {
      Object.assign(config, next);
      change(true);
      close();
      callbacks.onConfigChange(config, { relayout: true });
    }
  });

  overlay.querySelector("#ks-profile-add")?.addEventListener("click", () => {
    const input = overlay.querySelector("#ks-profile-name") as HTMLInputElement;
    const name = input?.value.trim();
    if (!name) {
      showToast("Enter a profile name", { error: true });
      input?.focus();
      return;
    }
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!id) {
      showToast("Invalid profile name", { error: true });
      return;
    }
    if (listProfiles().includes(id)) {
      showToast("Profile already exists", { error: true });
      return;
    }
    createProfile(id, structuredClone(config));
    const next = loadConfig();
    if (next) Object.assign(config, next);
    const select = overlay.querySelector("#ks-profile-select");
    if (select instanceof HTMLSelectElement && !select.querySelector(`option[value="${id}"]`)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = id;
      select.appendChild(opt);
    }
    if (select instanceof HTMLSelectElement) select.value = id;
    input.value = "";
    showToast(`Profile "${id}" created`);
    change(true);
  });

  const pwaBtn = overlay.querySelector("#ks-pwa-install") as HTMLButtonElement | null;
  if (pwaBtn) {
    pwaBtn.hidden = !canInstallPwa();
    window.addEventListener("ks:pwa-install-available", () => {
      pwaBtn.hidden = false;
    });
    pwaBtn.addEventListener("click", async () => {
      const result = await promptPwaInstall();
      if (result === "installed") showToast("App installed — open from your dock or home screen");
      else if (result === "dismissed") showToast("Install dismissed");
      pwaBtn.hidden = !canInstallPwa();
    });
  }

  overlay.querySelector("#ks-add-search")?.addEventListener("click", () => {
    if (!config.widgets.find((w) => w.type === "search")) {
      const topCount = config.widgets.filter((w) => w.enabled && w.layout.zone === "top").length;
      config.widgets.push({
        id: "search",
        type: "search",
        enabled: true,
        layout: { zone: "top", align: "center", order: topCount },
      });
      change(true);
      showToast("Search added");
    }
  });

  overlay.querySelector("#ks-add-clock")?.addEventListener("click", () => {
    if (!config.widgets.find((w) => w.type === "clock")) {
      config.widgets.push({
        id: "clock",
        type: "clock",
        enabled: true,
        layout: { zone: "top", align: "center", order: 1 },
        clock: { format: getSystemClockFormat(), zones: [{ label: "Local", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }] },
      });
      change(true);
      showToast("Clock added — edit timezones in edit mode");
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
      change(true);
      showToast("Quote added");
    }
  });

  const addWidget = (type: "pomodoro" | "note" | "hn", id: string, layout: KickstartConfig["widgets"][0]["layout"], extra?: object) => {
    if (config.widgets.find((w) => w.id === id)) return;
    config.widgets.push({ id, type, enabled: true, layout, ...extra } as KickstartConfig["widgets"][0]);
    change(true);
    showToast(`${type} added`);
  };

  overlay.querySelector("#ks-add-pomodoro")?.addEventListener("click", () =>
    addWidget("pomodoro", "pomodoro", { zone: "bottom", align: "center", order: 0 }, { pomodoro: { workMin: 25, breakMin: 5 } }),
  );
  overlay.querySelector("#ks-add-note")?.addEventListener("click", () =>
    addWidget("note", "note", { zone: "below-tree", align: "center", order: 0 }, { note: { text: "" } }),
  );
  overlay.querySelector("#ks-add-hn")?.addEventListener("click", () =>
    addWidget("hn", "hn", { zone: "below-tree", align: "center", order: 1 }, { hn: { count: 5 } }),
  );

  overlay.querySelector("#ks-export")?.addEventListener("click", () => downloadConfig(config));
  overlay.querySelector("#ks-copy-json")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(exportConfigJson(config));
    showToast("Copied to clipboard");
  });

  overlay.querySelector("#ks-import-settings")?.addEventListener("click", () => {
    const text = (overlay.querySelector("#ks-import-settings-text") as HTMLTextAreaElement).value;
    try {
      Object.assign(config, parseImportInput(text));
      change(true);
      showToast("Imported successfully");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Import failed", { error: true });
    }
  });

  overlay.querySelector("#ks-import-bookmarks")?.addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,.htm";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const html = await file.text();
        const cols = parseBookmarkHtml(html);
        config.tree.columns.push(...cols);
        change(true);
      showToast("Bookmarks imported");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Import failed", { error: true });
      }
    };
    input.click();
  });

  overlay.querySelector("#ks-copy-markdown")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(treeToMarkdown(config.tree.columns));
    showToast("Tree copied as markdown");
  });

  overlay.querySelector("#ks-show-welcome")?.addEventListener("click", async () => {
    close();
    const { showWelcome } = await import("../onboarding/welcome.ts");
    showWelcome({
      onReady: (c) => callbacks.onConfigChange(c, { relayout: true }),
      allowDismiss: true,
      onDismiss: () => undefined,
    });
  });

  overlay.querySelector("#ks-sync-enable")?.addEventListener("click", async () => {
    const { encryptConfig, generateSyncId } = await import("../sync/crypto.ts");
    const { pushSync } = await import("../sync/client.ts");
    const passphrase = (overlay.querySelector("#ks-sync-passphrase") as HTMLInputElement).value;
    if (!passphrase) return showToast("Enter a passphrase first", { error: true });
    config.sync ??= { enabled: false };
    if (!config.sync.syncId) config.sync.syncId = generateSyncId();
    config.sync.enabled = true;
    try {
      await pushSync(config.sync.syncId, await encryptConfig(exportConfigJson(config), passphrase));
      const idEl = overlay.querySelector("#ks-sync-id-display");
      if (idEl) idEl.textContent = config.sync.syncId;
      showToast("Synced to cloud");
      change(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Sync failed", { error: true });
    }
  });

  overlay.querySelector("#ks-sync-pull")?.addEventListener("click", async () => {
    const { decryptConfig } = await import("../sync/crypto.ts");
    const { pullSync } = await import("../sync/client.ts");
    const syncId = (overlay.querySelector("#ks-sync-id-input") as HTMLInputElement).value.trim();
    const passphrase = (overlay.querySelector("#ks-sync-passphrase-pull") as HTMLInputElement).value;
    if (!syncId) return showToast("Enter a sync ID to pull", { error: true });
    if (!passphrase) return showToast("Enter your passphrase to pull", { error: true });
    try {
      const blob = await pullSync(syncId);
      if (!blob) throw new Error("No config found");
      Object.assign(config, JSON.parse(await decryptConfig(blob, passphrase)));
      change(true);
      showToast("Restored from cloud");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Restore failed", { error: true });
    }
  });
}

function buildSettingsHtml(config: KickstartConfig): string {
  const bgType = config.appearance?.background?.type ?? "none";
  const bgValue = config.appearance?.background?.value ?? "";
  const accent = config.theme.custom?.["--ks-accent"] ?? "#89b4fa";
  const profiles = listProfiles()
    .map((p) => `<option value="${p}" ${loadMeta().activeProfile === p ? "selected" : ""}>${p}</option>`)
    .join("");
  const analytics = config.privacy?.analytics !== false;
  const favicons = config.privacy?.favicons !== false;

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
            ${buildThemeEditorHtml(config)}
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
          <div class="ks-settings-actions ks-widget-grid">
            <button id="ks-add-search" class="ks-btn">Search</button>
            <button id="ks-add-clock" class="ks-btn">Clock</button>
            <button id="ks-add-quote" class="ks-btn">Quote</button>
            <button id="ks-add-pomodoro" class="ks-btn">Pomodoro</button>
            <button id="ks-add-note" class="ks-btn">Note</button>
            <button id="ks-add-hn" class="ks-btn">Hacker News</button>
          </div>
          <p class="ks-settings-hint ks-settings-hint--widgets">Drag widgets in edit mode to reposition. The tree is always present.</p>
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
            <button id="ks-copy-markdown" class="ks-btn">Copy tree (MD)</button>
            <button id="ks-import-bookmarks" class="ks-btn">Import bookmarks</button>
          </div>
          <textarea id="ks-import-settings-text" class="ks-settings-textarea" rows="3" placeholder="Paste JSON or StartTreeV2 URL"></textarea>
          <button id="ks-import-settings" class="ks-btn ks-btn--primary ks-btn--block">Import</button>
            </div>
          </div>
        </details>

        <details class="ks-settings-group">
          <summary>Profiles &amp; privacy</summary>
          <div class="ks-settings-group-body">
            <div class="ks-settings-group-inner">
          <label class="ks-field">
            <span>Profile</span>
            <select id="ks-profile-select">${profiles}</select>
          </label>
          <div class="ks-profile-create">
            <input id="ks-profile-name" type="text" class="ks-field-input" placeholder="New profile name" />
            <button type="button" id="ks-profile-add" class="ks-btn ks-btn--small">Create</button>
          </div>
          <div class="ks-privacy-fields">
            <label class="ks-field ks-field--row ks-checkbox-field">
              <span>Speed Insights</span>
              <input id="ks-privacy-analytics" type="checkbox" ${analytics ? "checked" : ""} />
            </label>
            <label class="ks-field ks-field--row ks-checkbox-field">
              <span>Favicons</span>
              <input id="ks-privacy-favicons" type="checkbox" ${favicons ? "checked" : ""} />
            </label>
          </div>
          <button type="button" id="ks-pwa-install" class="ks-btn ks-btn--block" hidden>Install as app</button>
          <p class="ks-settings-hint">Installing adds kickstart to your dock/home screen, works offline after first visit, and opens in its own window.</p>
            </div>
          </div>
        </details>

        <details class="ks-settings-group">
          <summary>Cloud sync</summary>
          <div class="ks-settings-group-body">
            <div class="ks-settings-group-inner">
          <p class="ks-settings-hint">End-to-end encrypted. Server never sees your config.</p>

          <section class="ks-sync-card">
            <h3 class="ks-sync-card-title">Push to cloud</h3>
            <p class="ks-settings-hint">Save this device&rsquo;s config. Requires your passphrase.</p>
            <label class="ks-field">
              <span>Passphrase</span>
              <input id="ks-sync-passphrase" type="password" placeholder="Your sync passphrase" autocomplete="new-password" />
            </label>
            <button id="ks-sync-enable" class="ks-btn ks-btn--primary ks-btn--block">Push to cloud</button>
            <p class="ks-settings-hint ks-sync-id-line">Your sync ID: <code id="ks-sync-id-display">${config.sync?.syncId ?? "—"}</code></p>
          </section>

          <section class="ks-sync-card">
            <h3 class="ks-sync-card-title">Pull from cloud</h3>
            <p class="ks-settings-hint">Restore on a new device. Requires sync ID and passphrase.</p>
            <label class="ks-field">
              <span>Sync ID</span>
              <input id="ks-sync-id-input" type="text" placeholder="Paste sync ID" autocomplete="off" />
            </label>
            <label class="ks-field">
              <span>Passphrase</span>
              <input id="ks-sync-passphrase-pull" type="password" placeholder="Same passphrase used when pushing" autocomplete="current-password" />
            </label>
            <button id="ks-sync-pull" class="ks-btn ks-btn--block">Pull from cloud</button>
          </section>
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
