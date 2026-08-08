import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultConfig } from "../config/defaults.ts";
import type { AppContext } from "../layout/engine.ts";
import { renderPomodoro } from "./pomodoro.ts";
import { getPomodoroRuntime, resetPomodoroRuntime, setPomodoroRunning, tickPomodoro } from "./pomodoro-state.ts";

function makeCtx(editMode = false): AppContext {
  const config = createDefaultConfig();
  config.widgets.push({
    id: "pomodoro",
    type: "pomodoro",
    enabled: true,
    layout: { zone: "bottom", align: "center", order: 0 },
    pomodoro: { workMin: 25, breakMin: 5 },
  });
  return { config, editMode, onConfigChange: vi.fn() };
}

describe("pomodoro widget behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPomodoroRuntime("pomodoro");
  });

  it("shows start button in view mode", () => {
    const root = renderPomodoro(makeCtx(false), "pomodoro");
    expect(root.querySelector(".ks-btn")?.textContent).toBe("Start");
  });

  it("hides start button in edit mode", () => {
    const root = renderPomodoro(makeCtx(true), "pomodoro");
    expect(root.querySelector(".ks-btn")).toBeNull();
    expect(root.querySelector(".ks-settings-hint")?.textContent).toContain("timer keeps running");
  });

  it("shows daily focus session stats", () => {
    const root = renderPomodoro(makeCtx(false), "pomodoro");
    expect(root.querySelector(".ks-pomodoro-stats")?.textContent).toContain("focus session");
  });

  it("does not reset timer when re-rendered in edit mode", () => {
    const state = getPomodoroRuntime("pomodoro", 25, 5);
    state.secondsLeft = 42;
    renderPomodoro(makeCtx(true), "pomodoro");
    expect(getPomodoroRuntime("pomodoro", 25, 5).secondsLeft).toBe(42);
  });

  it("updates timer display in edit mode while running", () => {
    const state = getPomodoroRuntime("pomodoro", 25, 5);
    state.secondsLeft = 100;
    const root = renderPomodoro(makeCtx(true), "pomodoro");
    expect(root.querySelector(".ks-pomodoro-time")?.textContent).toBe("1:40");
    setPomodoroRunning("pomodoro", true);
    tickPomodoro("pomodoro");
    expect(root.querySelector(".ks-pomodoro-time")?.textContent).toBe("1:39");
    setPomodoroRunning("pomodoro", false);
  });

  it("toggles pause label on click", () => {
    const root = renderPomodoro(makeCtx(false), "pomodoro");
    const btn = root.querySelector(".ks-btn") as HTMLButtonElement;
    btn.click();
    expect(btn.textContent).toBe("Pause");
    btn.click();
    expect(btn.textContent).toBe("Start");
  });
});
