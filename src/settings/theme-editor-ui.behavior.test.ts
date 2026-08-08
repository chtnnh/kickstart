import { describe, expect, it, vi } from "vitest";
import { buildThemeEditorHtml, bindThemeEditor } from "./theme-editor-ui.ts";
import { createDefaultConfig } from "../config/defaults.ts";
import { applyTheme } from "../themes/engine.ts";
import { duplicatePaletteFromPreset } from "./theme-editor.ts";
import "../styles/ui.css";

describe("theme editor UI", () => {
  it("shows system theme pickers when mode is system", () => {
    const config = createDefaultConfig();
    config.theme.mode = "system";
    config.theme.systemDark = "catppuccin";
    config.theme.systemLight = "nord";
    const html = buildThemeEditorHtml(config);
    const overlay = document.createElement("div");
    overlay.innerHTML = html;
    expect(overlay.querySelector("#ks-system-themes")?.hasAttribute("hidden")).toBe(false);
    expect(overlay.querySelector("#ks-fixed-theme")?.hasAttribute("hidden")).toBe(true);
  });

  it("updates system dark preset on change", () => {
    const config = createDefaultConfig();
    config.theme.mode = "system";
    const overlay = document.createElement("div");
    overlay.innerHTML = buildThemeEditorHtml(config);
    const onChange = vi.fn();
    bindThemeEditor(overlay, config, onChange);
    const select = overlay.querySelector("#ks-theme-system-dark") as HTMLSelectElement;
    select.value = "gruvbox";
    select.dispatchEvent(new Event("change"));
    expect(config.theme.systemDark).toBe("gruvbox");
    expect(onChange).toHaveBeenCalled();
  });

  it("live-previews custom palette edits", () => {
    const config = createDefaultConfig();
    const id = "custom-test";
    config.theme.themes = {
      [id]: { label: "Test", palette: duplicatePaletteFromPreset("nord") },
    };
    config.theme.preset = id;
    const overlay = document.createElement("div");
    overlay.innerHTML = buildThemeEditorHtml(config);
    bindThemeEditor(overlay, config, () => applyTheme(config));
    const colorInput = overlay.querySelector('[data-palette-key="background"]') as HTMLInputElement;
    expect(colorInput).toBeTruthy();
    colorInput.value = "#222222";
    colorInput.dispatchEvent(new Event("input"));
    expect(document.documentElement.style.getPropertyValue("--background")).toBe("#222222");
  });

  it("hides system theme pickers in fixed mode via CSS", () => {
    const config = createDefaultConfig();
    config.theme.mode = "fixed";
    const overlay = document.createElement("div");
    overlay.innerHTML = buildThemeEditorHtml(config);
    document.body.appendChild(overlay);
    bindThemeEditor(overlay, config, vi.fn());
    const system = overlay.querySelector("#ks-system-themes") as HTMLElement;
    expect(getComputedStyle(system).display).toBe("none");
    overlay.remove();
  });
});
