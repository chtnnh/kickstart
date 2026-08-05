import type { KickstartConfig } from "./config/types.ts";
import {
  loadConfig,
  loadMeta,
  saveConfig,
  markOnboarded,
} from "./config/store.ts";
import { parseImportInput } from "./config/migrate-starttree.ts";
import { applyTheme, applyBackground } from "./themes/engine.ts";
import { renderLayout } from "./layout/engine.ts";
import { showWelcome } from "./onboarding/welcome.ts";
import { openSettings } from "./settings/panel.ts";
import { ICONS } from "./ui/icons.ts";
import "./styles/tokens.css";
import "./styles/tree.css";
import "./styles/layout.css";
import "./styles/ui.css";

export class App {
  config: KickstartConfig;
  editMode = false;
  private root: HTMLElement;
  private settingsOpen = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.config = loadConfig() ?? ({ v: "1" } as KickstartConfig);
  }

  start(): void {
    // Handle ?import= query param
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
      applyTheme({ ...this.config, theme: { preset: "catppuccin" } } as KickstartConfig);
      showWelcome({
        onReady: (config) => {
          this.config = config;
          this.boot();
        },
      });
      return;
    }

    if (!existing) {
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
    this.render();
  }

  private render(): void {
    document.body.classList.toggle("ks-editing", this.editMode);
    applyTheme(this.config);
    applyBackground(this.config);
    renderLayout(
      {
        config: this.config,
        editMode: this.editMode,
        onConfigChange: (c) => this.update(c),
      },
      this.root,
    );
    this.mountControls();
  }

  private update(config: KickstartConfig): void {
    this.config = config;
    saveConfig(config);
    if (!this.settingsOpen) this.render();
    applyTheme(config);
    applyBackground(config);
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
      this.settingsOpen = true;
      openSettings(this.config, {
        onConfigChange: (c) => {
          this.config = c;
          saveConfig(c, true);
          applyTheme(c);
          applyBackground(c);
          this.render();
        },
        onClose: () => {
          this.settingsOpen = false;
        },
        onShowWelcome: () => {
          this.settingsOpen = false;
        },
      });
    });

    bar.appendChild(editBtn);
    bar.appendChild(settingsBtn);
  }
}
