import type { KickstartConfig } from "./config/types.ts";
import {
  loadConfig,
  loadMeta,
  saveConfig,
  markOnboarded,
} from "./config/store.ts";
import { parseImportInput } from "./config/migrate-starttree.ts";
import { applyTheme, applyBackground, watchSystemTheme } from "./themes/engine.ts";
import { renderLayout } from "./layout/engine.ts";
import { ICONS } from "./ui/icons.ts";
import { initKeyboardShortcuts } from "./lib/keyboard.ts";
import { initPwaInstall } from "./lib/pwa-install.ts";
import { scheduleSearchFocus } from "./widgets/search.ts";
import { clearUndo } from "./tree/undo.ts";
import "./styles/tokens.css";
import "./styles/tree.css";
import "./styles/layout.css";
import "./styles/ui.css";

export class App {
  config: KickstartConfig;
  editMode = false;
  private root: HTMLElement;
  private settingsOpen = false;
  private settingsModule: Promise<typeof import("./settings/panel.ts")> | null = null;
  private unwatchSystem: (() => void) | null = null;
  private unbindKeys: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.config = loadConfig() ?? ({ v: "2" } as KickstartConfig);
  }

  async start(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const importParam = params.get("import");
    if (importParam) {
      try {
        const config = parseImportInput(decodeURIComponent(importParam));
        saveConfig(config, true);
        markOnboarded();
        history.replaceState({}, "", window.location.pathname);
        this.config = config;
        this.boot();
        return;
      } catch {
        /* fall through */
      }
    }

    const meta = loadMeta();
    const existing = loadConfig();

    if (!existing && !meta.onboarded) {
      applyTheme({ ...this.config, theme: { preset: "catppuccin", mode: "fixed", themes: {} } } as KickstartConfig);
      const { showWelcome } = await import("./onboarding/welcome.ts");
      showWelcome({
        onReady: (config) => {
          this.config = config;
          this.boot();
        },
      });
      return;
    }

    if (!existing) {
      const { showWelcome } = await import("./onboarding/welcome.ts");
      showWelcome({
        onReady: (config) => {
          this.config = config;
          this.boot();
        },
      });
      return;
    }

    this.config = existing;
    this.boot();
  }

  private boot(): void {
    this.unwatchSystem?.();
    this.unwatchSystem = watchSystemTheme(() => {
      if (this.config.theme.mode === "system") {
        applyTheme(this.config);
        applyBackground(this.config);
      }
    });
    this.unbindKeys?.();
    this.unbindKeys = initKeyboardShortcuts({
      toggleEdit: () => {
        if (this.editMode) {
          clearUndo();
          document.querySelector(".ks-undo-bar")?.remove();
        }
        this.editMode = !this.editMode;
        if (!this.editMode) saveConfig(this.config, true);
        this.render();
      },
      openCommandPalette: () => void this.openCommandPalette(),
      openSettings: () => void this.openSettings(),
      closeOverlays: () => {
        document.querySelector(".ks-settings-overlay")?.remove();
        document.querySelector(".ks-welcome-overlay")?.remove();
        document.querySelector(".ks-shortcuts-overlay")?.remove();
        document.querySelector(".ks-cmd-overlay")?.remove();
        this.settingsOpen = false;
        if (this.editMode) {
          this.editMode = false;
          this.render();
        }
      },
    });
    this.preloadSettings();
    this.render();
    initPwaInstall();
    void import("./lib/speed-insights.ts").then((m) => m.initSpeedInsights(this.config));
    void import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: false });
    });
  }

  private async openCommandPalette(): Promise<void> {
    const { openCommandPalette } = await import("./lib/command-palette.ts");
    openCommandPalette(this.config, {
      onSelectTheme: (id) => {
        this.config.theme.preset = id;
        saveConfig(this.config, true);
        applyTheme(this.config);
      },
      onNavigate: (url) => {
        window.location.href = url;
      },
      onToggleEdit: () => {
        this.editMode = !this.editMode;
        this.render();
      },
    });
  }

  render(): void {
    document.body.classList.toggle("ks-editing", this.editMode);
    applyTheme(this.config);
    applyBackground(this.config);
    renderLayout(
      {
        config: this.config,
        editMode: this.editMode,
        onConfigChange: (c) => this.update(c, { relayout: true }),
      },
      this.root,
    );
    this.mountControls();
    if (!this.editMode && !this.settingsOpen) scheduleSearchFocus();
  }

  private update(config: KickstartConfig, opts?: { relayout?: boolean }): void {
    this.config = config;
    saveConfig(config);
    applyTheme(config);
    applyBackground(config);
    if (!this.settingsOpen || opts?.relayout) this.render();
  }

  private mountControls(): void {
    document.querySelectorAll(".ks-control").forEach((el) => el.remove());

    let bar = document.querySelector(".ks-controls") as HTMLElement | null;
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "ks-controls";
      document.body.appendChild(bar);
    }
    bar.innerHTML = "";

    const editBtn = document.createElement("button");
    editBtn.className = "ks-control ks-control--edit";
    editBtn.innerHTML = this.editMode ? ICONS.floppy : ICONS.pencil;
    editBtn.title = this.editMode ? "Save & exit edit mode" : "Edit";
    editBtn.setAttribute("aria-label", this.editMode ? "Save" : "Edit");
    editBtn.addEventListener("click", () => {
      if (this.editMode) {
        clearUndo();
        document.querySelector(".ks-undo-bar")?.remove();
      }
      this.editMode = !this.editMode;
      if (!this.editMode) saveConfig(this.config, true);
      this.render();
    });

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "ks-control ks-control--settings";
    settingsBtn.innerHTML = ICONS.gear;
    settingsBtn.title = "Settings";
    settingsBtn.setAttribute("aria-label", "Settings");
    settingsBtn.addEventListener("click", () => {
      void this.openSettings(settingsBtn);
    });

    bar.appendChild(editBtn);
    bar.appendChild(settingsBtn);
  }

  private preloadSettings(): void {
    this.settingsModule ??= import("./settings/panel.ts");
  }

  private async openSettings(trigger?: HTMLButtonElement): Promise<void> {
    if (document.querySelector(".ks-settings-overlay")) return;

    trigger?.setAttribute("aria-busy", "true");
    trigger?.setAttribute("disabled", "true");
    try {
      const { openSettings } = await (this.settingsModule ??= import("./settings/panel.ts"));
      this.settingsOpen = true;
      openSettings(this.config, {
        onConfigChange: (c, opts) => this.update(c, opts),
        onClose: () => {
          this.settingsOpen = false;
        },
        onShowWelcome: () => {
          this.settingsOpen = false;
        },
      });
    } catch (err) {
      this.settingsOpen = false;
      console.error("Failed to open settings", err);
    } finally {
      trigger?.removeAttribute("aria-busy");
      trigger?.removeAttribute("disabled");
    }
  }
}
