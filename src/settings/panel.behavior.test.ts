import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultConfig } from "../config/defaults.ts";
import { openSettings } from "./panel.ts";
import "../styles/ui.css";

describe("settings panel behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("opens settings overlay", () => {
    const config = createDefaultConfig();
    openSettings(config, {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    });
    expect(document.querySelector(".ks-settings-overlay")).toBeTruthy();
    expect(document.querySelector(".ks-settings-panel h2")?.textContent).toBe("Settings");
  });

  it("does not open duplicate overlays", () => {
    const config = createDefaultConfig();
    const callbacks = {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    };
    openSettings(config, callbacks);
    openSettings(config, callbacks);
    expect(document.querySelectorAll(".ks-settings-overlay")).toHaveLength(1);
  });

  it("hides system theme pickers when mode is fixed", () => {
    const config = createDefaultConfig();
    config.theme.mode = "fixed";
    openSettings(config, {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    });
    const system = document.querySelector("#ks-system-themes") as HTMLElement;
    const fixed = document.querySelector("#ks-fixed-theme") as HTMLElement;
    expect(system.hidden).toBe(true);
    expect(fixed.hidden).toBe(false);
    expect(getComputedStyle(system).display).toBe("none");
  });

  it("spaces widget hint below widget buttons", () => {
    const config = createDefaultConfig();
    openSettings(config, {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    });
    const hint = document.querySelector(".ks-settings-hint--widgets");
    expect(hint).toBeTruthy();
  });

  it("uses compact create profile button", () => {
    const config = createDefaultConfig();
    openSettings(config, {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    });
    const btn = document.querySelector("#ks-profile-add");
    expect(btn?.classList.contains("ks-btn--small")).toBe(true);
    expect(btn?.classList.contains("ks-btn--primary")).toBe(false);
  });

  it("groups privacy checkboxes with spacing", () => {
    const config = createDefaultConfig();
    openSettings(config, {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    });
    expect(document.querySelector(".ks-privacy-fields")).toBeTruthy();
    expect(document.querySelectorAll(".ks-privacy-fields .ks-checkbox-field")).toHaveLength(2);
  });

  it("separates push and pull sync into distinct cards", () => {
    const config = createDefaultConfig();
    openSettings(config, {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    });
    const cards = document.querySelectorAll(".ks-sync-card");
    expect(cards).toHaveLength(2);
    expect(document.querySelector("#ks-sync-passphrase")).toBeTruthy();
    expect(document.querySelector("#ks-sync-passphrase-pull")).toBeTruthy();
    expect(document.querySelector("#ks-sync-id-input")).toBeTruthy();
  });

  it("shows sync id in push card only", () => {
    const config = createDefaultConfig();
    config.sync = { enabled: true, syncId: "abc-123" };
    openSettings(config, {
      onConfigChange: vi.fn(),
      onClose: vi.fn(),
      onShowWelcome: vi.fn(),
    });
    expect(document.querySelector("#ks-sync-id-display")?.textContent).toBe("abc-123");
  });
});
