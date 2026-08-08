import type { KickstartConfig } from "../config/types.ts";
import { applyTheme } from "../themes/engine.ts";
import {
  PALETTE_KEYS,
  createCustomThemeId,
  duplicatePaletteFromPreset,
  exportThemeJson,
  parseThemeImport,
  themeExportFilename,
} from "./theme-editor.ts";
import { listThemeOptions } from "../themes/presets.ts";
import { showToast } from "../lib/toast.ts";
import { saveConfig } from "../config/store.ts";

export function buildThemeEditorHtml(config: KickstartConfig): string {
  const mode = config.theme.mode ?? "fixed";
  const fontSize = config.appearance?.fontSize ?? "md";
  const themeOptions = listThemeOptions(config)
    .map(
      (p) =>
        `<option value="${p.id}" ${config.theme.preset === p.id ? "selected" : ""}>${escapeAttr(p.name)}</option>`,
    )
    .join("");
  const systemOptions = (selected: string) =>
    listThemeOptions(config)
      .map(
        (p) =>
          `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${escapeAttr(p.name)}</option>`,
      )
      .join("");
  const systemDark = config.theme.systemDark ?? config.theme.preset ?? "catppuccin";
  const systemLight = config.theme.systemLight ?? "nord";
  const editingCustom = Boolean(config.theme.themes?.[config.theme.preset ?? ""]);

  return `
    <div class="ks-theme-section">
      <label class="ks-field">
        <span>Theme mode</span>
        <select id="ks-theme-mode">
          <option value="fixed" ${mode === "fixed" ? "selected" : ""}>Fixed preset</option>
          <option value="system" ${mode === "system" ? "selected" : ""}>Follow system</option>
        </select>
      </label>
      <div id="ks-system-themes" class="ks-theme-subsection" ${mode === "system" ? "" : "hidden"}>
        <label class="ks-field">
          <span>Dark theme</span>
          <select id="ks-theme-system-dark">${systemOptions(systemDark)}</select>
        </label>
        <label class="ks-field">
          <span>Light theme</span>
          <select id="ks-theme-system-light">${systemOptions(systemLight)}</select>
        </label>
      </div>
      <label class="ks-field" id="ks-fixed-theme" ${mode === "fixed" ? "" : "hidden"}>
        <span>Theme</span>
        <select id="ks-theme-select">${themeOptions}</select>
      </label>
      <label class="ks-field">
        <span>Font size</span>
        <select id="ks-font-size">
          <option value="sm" ${fontSize === "sm" ? "selected" : ""}>Small</option>
          <option value="md" ${fontSize === "md" ? "selected" : ""}>Medium</option>
          <option value="lg" ${fontSize === "lg" ? "selected" : ""}>Large</option>
        </select>
      </label>
      <div class="ks-settings-actions ks-settings-actions--tight">
        <button type="button" id="ks-theme-new" class="ks-btn">Create custom theme</button>
        <button type="button" id="ks-theme-save" class="ks-btn ks-btn--primary" ${editingCustom ? "" : "hidden"}>Save theme</button>
        <button type="button" id="ks-theme-export" class="ks-btn">Export theme</button>
      </div>
      <p class="ks-settings-hint" id="ks-theme-hint" ${editingCustom ? "" : "hidden"}>Editing a custom theme — click Save theme to persist changes.</p>
      <div id="ks-theme-editor" class="ks-theme-editor" hidden></div>
      <details class="ks-settings-subdetails">
        <summary>Import theme JSON</summary>
        <textarea id="ks-theme-import" class="ks-settings-textarea" rows="2" placeholder="Paste theme JSON"></textarea>
        <button type="button" id="ks-theme-import-btn" class="ks-btn ks-btn--block">Import theme</button>
      </details>
    </div>
  `;
}

export function bindThemeEditor(
  overlay: HTMLElement,
  config: KickstartConfig,
  onChange: (c: KickstartConfig) => void,
): void {
  const hint = () => overlay.querySelector("#ks-theme-hint") as HTMLElement | null;
  const saveBtn = () => overlay.querySelector("#ks-theme-save") as HTMLButtonElement | null;

  const refreshCustomUi = (themeId: string) => {
    const isCustom = Boolean(config.theme.themes?.[themeId]);
    if (hint()) hint()!.hidden = !isCustom;
    if (saveBtn()) saveBtn()!.hidden = !isCustom;
    renderEditorGrid(overlay, config, themeId, onChange);
  };

  overlay.querySelector("#ks-theme-mode")?.addEventListener("change", (e) => {
    config.theme.mode = (e.target as HTMLSelectElement).value as "fixed" | "system";
    const systemBlock = overlay.querySelector("#ks-system-themes") as HTMLElement | null;
    const fixedBlock = overlay.querySelector("#ks-fixed-theme") as HTMLElement | null;
    const isSystem = config.theme.mode === "system";
    if (systemBlock) {
      systemBlock.hidden = !isSystem;
      systemBlock.style.display = isSystem ? "" : "none";
    }
    if (fixedBlock) {
      fixedBlock.hidden = isSystem;
      fixedBlock.style.display = isSystem ? "none" : "";
    }
    onChange(config);
  });

  overlay.querySelector("#ks-theme-system-dark")?.addEventListener("change", (e) => {
    config.theme.systemDark = (e.target as HTMLSelectElement).value;
    onChange(config);
  });

  overlay.querySelector("#ks-theme-system-light")?.addEventListener("change", (e) => {
    config.theme.systemLight = (e.target as HTMLSelectElement).value;
    onChange(config);
  });

  overlay.querySelector("#ks-theme-select")?.addEventListener("change", (e) => {
    config.theme.preset = (e.target as HTMLSelectElement).value;
    refreshCustomUi(config.theme.preset!);
    onChange(config);
  });

  overlay.querySelector("#ks-font-size")?.addEventListener("change", (e) => {
    config.appearance ??= { background: { type: "none" } };
    config.appearance.fontSize = (e.target as HTMLSelectElement).value as "sm" | "md" | "lg";
    onChange(config);
  });

  overlay.querySelector("#ks-theme-new")?.addEventListener("click", () => {
    const base = config.theme.preset ?? "catppuccin";
    const id = createCustomThemeId("My theme");
    config.theme.themes ??= {};
    config.theme.themes[id] = {
      label: "My theme",
      palette: duplicatePaletteFromPreset(base),
    };
    config.theme.preset = id;
    refreshThemeSelect(overlay, config);
    refreshCustomUi(id);
    onChange(config);
    showToast("Custom theme created — edit colors then Save theme");
  });

  overlay.querySelector("#ks-theme-save")?.addEventListener("click", () => {
    const id = config.theme.preset ?? "";
    if (!config.theme.themes?.[id]) {
      showToast("Select a custom theme to save", { error: true });
      return;
    }
    saveConfig(config, true);
    showToast(`Theme "${config.theme.themes[id]!.label}" saved`);
    onChange(config);
  });

  overlay.querySelector("#ks-theme-export")?.addEventListener("click", () => {
    const id = config.theme.preset ?? "catppuccin";
    const custom = config.theme.themes?.[id];
    if (!custom) {
      showToast("Select a custom theme to export", { error: true });
      return;
    }
    downloadText(exportThemeJson(id, custom), themeExportFilename(custom));
    showToast(`Exported ${custom.label}`);
  });

  overlay.querySelector("#ks-theme-import-btn")?.addEventListener("click", () => {
    const raw = (overlay.querySelector("#ks-theme-import") as HTMLTextAreaElement).value;
    try {
      const { id, theme } = parseThemeImport(raw);
      config.theme.themes ??= {};
      config.theme.themes[id] = theme;
      config.theme.preset = id;
      refreshThemeSelect(overlay, config);
      refreshCustomUi(id);
      onChange(config);
      showToast("Theme imported — click Save theme to persist");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Import failed", { error: true });
    }
  });

  const systemBlock = overlay.querySelector("#ks-system-themes") as HTMLElement | null;
  const fixedBlock = overlay.querySelector("#ks-fixed-theme") as HTMLElement | null;
  const isSystem = config.theme.mode === "system";
  if (systemBlock) {
    systemBlock.hidden = !isSystem;
    systemBlock.style.display = isSystem ? "" : "none";
  }
  if (fixedBlock) {
    fixedBlock.hidden = isSystem;
    fixedBlock.style.display = isSystem ? "none" : "";
  }

  const preset = config.theme.preset ?? "";
  if (config.theme.themes?.[preset]) refreshCustomUi(preset);
}

function renderEditorGrid(
  overlay: HTMLElement,
  config: KickstartConfig,
  themeId: string,
  onChange: (c: KickstartConfig) => void,
): void {
  const host = overlay.querySelector("#ks-theme-editor") as HTMLElement;
  const theme = config.theme.themes?.[themeId];
  if (!theme) {
    host.hidden = true;
    return;
  }
  host.hidden = false;
  host.innerHTML = `<label class="ks-field"><span>Theme name</span><input id="ks-theme-label" type="text" value="${escapeAttr(theme.label)}" /></label>
    <div class="ks-theme-grid">${PALETTE_KEYS.map((key) => `
      <label class="ks-field ks-field--row"><span>${key}</span>
        <input type="color" data-palette-key="${key}" value="${theme.palette[key]}" />
      </label>`).join("")}</div>`;

  host.querySelector("#ks-theme-label")?.addEventListener("input", (e) => {
    theme.label = (e.target as HTMLInputElement).value;
    refreshThemeSelect(overlay, config);
    onChange(config);
  });

  host.querySelectorAll("[data-palette-key]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const key = (e.target as HTMLInputElement).dataset.paletteKey as keyof typeof theme.palette;
      theme.palette[key] = (e.target as HTMLInputElement).value;
      applyTheme(config);
      onChange(config);
    });
  });
}

function refreshThemeSelect(overlay: HTMLElement, config: KickstartConfig): void {
  const sel = overlay.querySelector("#ks-theme-select") as HTMLSelectElement | null;
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = listThemeOptions(config)
    .map((p) => `<option value="${p.id}">${escapeAttr(p.name)}</option>`)
    .join("");
  sel.value = config.theme.preset ?? current;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

function downloadText(text: string, filename: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
