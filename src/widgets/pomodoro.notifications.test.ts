import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyPomodoroPhaseComplete } from "./pomodoro-state.ts";

describe("pomodoro notifications", () => {
  const originalNotification = globalThis.Notification;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.Notification = originalNotification;
  });

  it("shows notification when permission is granted", () => {
    const ctor = vi.fn();
    globalThis.Notification = ctor as unknown as typeof Notification;
    Object.defineProperty(globalThis.Notification, "permission", { value: "granted", configurable: true });
    notifyPomodoroPhaseComplete("focus");
    expect(ctor).toHaveBeenCalledWith("Focus session complete", { body: "Time for a break." });
  });

  it("requests permission when not yet decided", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const ctor = vi.fn();
    globalThis.Notification = ctor as unknown as typeof Notification;
    Object.defineProperty(globalThis.Notification, "permission", { value: "default", configurable: true });
    Object.defineProperty(globalThis.Notification, "requestPermission", {
      value: requestPermission,
      configurable: true,
    });
    notifyPomodoroPhaseComplete("break");
    await Promise.resolve();
    expect(requestPermission).toHaveBeenCalled();
  });

  it("uses break-complete copy for break phase", () => {
    const ctor = vi.fn();
    globalThis.Notification = ctor as unknown as typeof Notification;
    Object.defineProperty(globalThis.Notification, "permission", { value: "granted", configurable: true });
    notifyPomodoroPhaseComplete("break");
    expect(ctor).toHaveBeenCalledWith("Break complete", { body: "Back to focus." });
  });
});
