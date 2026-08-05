import type { KickstartConfig } from "../config/types.ts";
import { createDefaultConfig } from "../config/defaults.ts";
import { markOnboarded, saveConfig } from "../config/store.ts";
import { parseImportInput } from "../config/migrate-starttree.ts";
import { decryptConfig } from "../sync/crypto.ts";
import { pullSync } from "../sync/client.ts";
import "./welcome.css";

export interface WelcomeOptions {
  onReady: (config: KickstartConfig) => void;
  allowDismiss?: boolean;
  onDismiss?: () => void;
}

export function showWelcome(options: WelcomeOptions): void {
  const overlay = document.createElement("div");
  overlay.className = "ks-welcome-overlay";
  overlay.innerHTML = buildMainView(options.allowDismiss ?? false);
  document.body.appendChild(overlay);

  let panel: "main" | "import" | "sync" = "main";

  const dismiss = () => {
    overlay.remove();
    options.onDismiss?.();
  };

  const bindOverlayDismiss = () => {
    overlay.onclick = (e) => {
      if (e.target === overlay && options.allowDismiss) dismiss();
    };
  };

  const render = () => {
    if (panel === "main") overlay.innerHTML = buildMainView(options.allowDismiss ?? false);
    else if (panel === "import") overlay.innerHTML = buildImportView(options.allowDismiss ?? false);
    else overlay.innerHTML = buildSyncView(options.allowDismiss ?? false);
    bindEvents();
    bindOverlayDismiss();
    overlay.querySelector(".ks-welcome-card")?.addEventListener("click", (e) => e.stopPropagation());
  };

  const finish = (config: KickstartConfig) => {
    saveConfig(config, true);
    markOnboarded();
    overlay.remove();
    options.onReady(config);
  };

  const bindEvents = () => {
    overlay.querySelector("#ks-welcome-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (options.allowDismiss) dismiss();
    });

    overlay.querySelector("#ks-welcome-fresh")?.addEventListener("click", () => {
      finish(createDefaultConfig());
    });
    overlay.querySelector("#ks-welcome-import-btn")?.addEventListener("click", () => {
      panel = "import";
      render();
    });
    overlay.querySelector("#ks-welcome-sync-btn")?.addEventListener("click", () => {
      panel = "sync";
      render();
    });
    overlay.querySelector("#ks-welcome-back")?.addEventListener("click", () => {
      panel = "main";
      render();
    });

    overlay.querySelector("#ks-import-submit")?.addEventListener("click", async () => {
      const textarea = overlay.querySelector("#ks-import-text") as HTMLTextAreaElement;
      const fileInput = overlay.querySelector("#ks-import-file") as HTMLInputElement;
      const errEl = overlay.querySelector("#ks-import-error") as HTMLElement;
      try {
        let config: KickstartConfig;
        if (fileInput.files?.[0]) {
          const text = await fileInput.files[0].text();
          config = parseImportInput(text);
        } else {
          config = parseImportInput(textarea.value);
        }
        finish(config);
      } catch (e) {
        errEl.textContent = e instanceof Error ? e.message : "Import failed";
      }
    });

    overlay.querySelector("#ks-sync-submit")?.addEventListener("click", async () => {
      const syncId = (overlay.querySelector("#ks-sync-id") as HTMLInputElement).value.trim();
      const passphrase = (overlay.querySelector("#ks-sync-pass") as HTMLInputElement).value;
      const errEl = overlay.querySelector("#ks-sync-error") as HTMLElement;
      try {
        const blob = await pullSync(syncId);
        if (!blob) throw new Error("No config found for this sync ID");
        const json = await decryptConfig(blob, passphrase);
        const config = JSON.parse(json) as KickstartConfig;
        finish(config);
      } catch (e) {
        errEl.textContent = e instanceof Error ? e.message : "Restore failed";
      }
    });
  };

  bindEvents();
  bindOverlayDismiss();
  overlay.querySelector(".ks-welcome-card")?.addEventListener("click", (e) => e.stopPropagation());
}

function dismissHeader(allowDismiss: boolean): string {
  if (!allowDismiss) return "";
  return `<button id="ks-welcome-close" class="ks-welcome-close" aria-label="Close">×</button>`;
}

function buildMainView(allowDismiss: boolean): string {
  return `
    <div class="ks-welcome-card">
      ${dismissHeader(allowDismiss)}
      <h1 class="ks-welcome-title">kickstart</h1>
      <p class="ks-welcome-sub">Your fast, private new-tab start page.</p>
      <p class="ks-welcome-desc">Bookmarks, search, themes. Config stays on this device.</p>
      <div class="ks-welcome-actions">
        <button id="ks-welcome-fresh" class="ks-btn ks-btn--primary">Start fresh</button>
        <button id="ks-welcome-import-btn" class="ks-btn">Import config</button>
        <button id="ks-welcome-sync-btn" class="ks-btn">Restore from sync</button>
      </div>
      <p class="ks-welcome-hint">✎ Edit anytime · Set this URL as your new-tab page</p>
    </div>
  `;
}

function buildImportView(allowDismiss: boolean): string {
  return `
    <div class="ks-welcome-card">
      ${dismissHeader(allowDismiss)}
      <h2 class="ks-welcome-title">Import config</h2>
      <p class="ks-welcome-desc">Paste JSON, a StartTreeV2 URL, or upload a file.</p>
      <textarea id="ks-import-text" class="ks-welcome-input" rows="3" placeholder='{"v":"1",...} or https://...?t=~(...)'></textarea>
      <input id="ks-import-file" type="file" accept=".json,application/json" class="ks-welcome-file" />
      <p id="ks-import-error" class="ks-welcome-error"></p>
      <div class="ks-welcome-actions">
        <button id="ks-import-submit" class="ks-btn ks-btn--primary">Import</button>
        <button id="ks-welcome-back" class="ks-btn">Back</button>
      </div>
    </div>
  `;
}

function buildSyncView(allowDismiss: boolean): string {
  return `
    <div class="ks-welcome-card">
      ${dismissHeader(allowDismiss)}
      <h2 class="ks-welcome-title">Restore from sync</h2>
      <p class="ks-welcome-desc">Enter your sync ID and passphrase.</p>
      <input id="ks-sync-id" class="ks-welcome-input" placeholder="Sync ID" />
      <input id="ks-sync-pass" type="password" class="ks-welcome-input" placeholder="Passphrase" />
      <p id="ks-sync-error" class="ks-welcome-error"></p>
      <div class="ks-welcome-actions">
        <button id="ks-sync-submit" class="ks-btn ks-btn--primary">Restore</button>
        <button id="ks-welcome-back" class="ks-btn">Back</button>
      </div>
    </div>
  `;
}
