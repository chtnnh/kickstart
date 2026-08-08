import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canInstallPwa, initPwaInstall, promptPwaInstall } from "./pwa-install.ts";

describe("pwa install extended", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unavailable when no deferred prompt", async () => {
    expect(await promptPwaInstall()).toBe("unavailable");
  });

  it("captures beforeinstallprompt and exposes availability", () => {
    initPwaInstall();
    const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      preventDefault: () => void;
    };
    event.preventDefault = vi.fn();
    window.dispatchEvent(event);
    expect(canInstallPwa()).toBe(true);
  });

  it("prompts install and reports installed", async () => {
    initPwaInstall();
    const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" }>;
    };
    event.preventDefault = vi.fn();
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(event);
    expect(await promptPwaInstall()).toBe("installed");
    expect(canInstallPwa()).toBe(false);
  });

  it("reports dismissed install", async () => {
    initPwaInstall();
    const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "dismissed" }>;
    };
    event.preventDefault = vi.fn();
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
    expect(await promptPwaInstall()).toBe("dismissed");
  });
});
