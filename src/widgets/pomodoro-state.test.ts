import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatPomodoroTime,
  getPomodoroRuntime,
  loadPomodoroStats,
  recordFocusSession,
  resetPomodoroRuntime,
  setPomodoroRunning,
  subscribePomodoro,
  tickPomodoro,
} from "./pomodoro-state.ts";

describe("pomodoro state", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPomodoroRuntime("p1");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetPomodoroRuntime("p1");
  });

  it("formats time with leading seconds", () => {
    expect(formatPomodoroTime(0)).toBe("0:00");
    expect(formatPomodoroTime(65)).toBe("1:05");
    expect(formatPomodoroTime(1500)).toBe("25:00");
  });

  it("initializes runtime from work and break minutes", () => {
    const state = getPomodoroRuntime("p1", 25, 5);
    expect(state.secondsLeft).toBe(1500);
    expect(state.phase).toBe("focus");
    expect(state.running).toBe(false);
  });

  it("reuses runtime when config unchanged", () => {
    const a = getPomodoroRuntime("p1", 25, 5);
    a.secondsLeft = 999;
    const b = getPomodoroRuntime("p1", 25, 5);
    expect(b.secondsLeft).toBe(999);
  });

  it("resets runtime when durations change", () => {
    const a = getPomodoroRuntime("p1", 25, 5);
    a.secondsLeft = 10;
    const b = getPomodoroRuntime("p1", 20, 5);
    expect(b.secondsLeft).toBe(1200);
  });

  it("ticks down while running", () => {
    const state = getPomodoroRuntime("p1", 25, 5);
    state.secondsLeft = 3;
    setPomodoroRunning("p1", true);
    expect(tickPomodoro("p1")).toBe("continued");
    expect(state.secondsLeft).toBe(2);
  });

  it("switches to break after focus completes", () => {
    const state = getPomodoroRuntime("p1", 25, 5);
    state.secondsLeft = 0;
    state.running = true;
    expect(tickPomodoro("p1")).toBe("phase-complete");
    expect(state.phase).toBe("break");
    expect(state.secondsLeft).toBe(300);
  });

  it("records focus sessions when focus phase ends", () => {
    const state = getPomodoroRuntime("p1", 25, 5);
    state.secondsLeft = 0;
    state.running = true;
    tickPomodoro("p1");
    expect(loadPomodoroStats().focusSessions).toBe(1);
    recordFocusSession();
    expect(loadPomodoroStats().focusSessions).toBe(2);
  });

  it("resets daily stats on a new day", () => {
    recordFocusSession();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    localStorage.setItem(
      "kickstart:pomodoro-stats",
      JSON.stringify({ date: yesterday.toISOString().slice(0, 10), focusSessions: 4 }),
    );
    expect(loadPomodoroStats().focusSessions).toBe(0);
  });

  it("returns zero stats when storage is corrupt", () => {
    localStorage.setItem("kickstart:pomodoro-stats", "bad");
    expect(loadPomodoroStats().focusSessions).toBe(0);
  });

  it("starts and stops interval when running toggled", () => {
    getPomodoroRuntime("p1", 25, 5);
    setPomodoroRunning("p1", true);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    setPomodoroRunning("p1", false);
  });

  it("does not tick when paused", () => {
    const state = getPomodoroRuntime("p1", 25, 5);
    state.secondsLeft = 10;
    expect(tickPomodoro("p1")).toBe("continued");
    expect(state.secondsLeft).toBe(10);
  });

  it("returns to focus after break completes", () => {
    const state = getPomodoroRuntime("p1", 25, 5);
    state.phase = "break";
    state.secondsLeft = 0;
    state.running = true;
    tickPomodoro("p1");
    expect(state.phase).toBe("focus");
    expect(state.secondsLeft).toBe(1500);
  });

  it("clears runtime on reset", () => {
    getPomodoroRuntime("p1", 25, 5);
    resetPomodoroRuntime("p1");
    const next = getPomodoroRuntime("p1", 25, 5);
    expect(next.secondsLeft).toBe(1500);
  });

  it("notifies subscribers on tick", () => {
    const state = getPomodoroRuntime("p1", 25, 5);
    state.secondsLeft = 5;
    state.running = true;
    let calls = 0;
    const unsub = subscribePomodoro("p1", () => {
      calls += 1;
    });
    tickPomodoro("p1");
    expect(calls).toBeGreaterThan(0);
    unsub();
  });
});
