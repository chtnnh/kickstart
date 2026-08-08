import type { AppContext } from "../layout/engine.ts";
import {
  formatPomodoroTime,
  getPomodoroRuntime,
  loadPomodoroStats,
  setPomodoroRunning,
  subscribePomodoro,
} from "./pomodoro-state.ts";

export function renderPomodoro(ctx: AppContext, widgetId: string): HTMLElement {
  const widget = ctx.config.widgets.find((w) => w.id === widgetId);
  const workMin = widget?.pomodoro?.workMin ?? 25;
  const breakMin = widget?.pomodoro?.breakMin ?? 5;
  const state = getPomodoroRuntime(widgetId, workMin, breakMin);
  const stats = loadPomodoroStats();

  const root = document.createElement("div");
  root.className = "ks-pomodoro";

  const label = document.createElement("div");
  label.className = "ks-pomodoro-label";
  const time = document.createElement("div");
  time.className = "ks-pomodoro-time";
  const statsEl = document.createElement("div");
  statsEl.className = "ks-pomodoro-stats";

  const paint = () => {
    label.textContent = state.phase === "break" ? "Break" : "Focus";
    time.textContent = formatPomodoroTime(state.secondsLeft);
    const latest = loadPomodoroStats();
    statsEl.textContent = `${latest.focusSessions} focus session${latest.focusSessions === 1 ? "" : "s"} today`;
  };

  paint();
  statsEl.textContent = `${stats.focusSessions} focus session${stats.focusSessions === 1 ? "" : "s"} today`;

  root.appendChild(label);
  root.appendChild(time);
  root.appendChild(statsEl);

  subscribePomodoro(widgetId, paint);

  if (!ctx.editMode) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ks-btn ks-btn--small";
    btn.textContent = state.running ? "Pause" : "Start";
    btn.addEventListener("click", () => {
      setPomodoroRunning(widgetId, !state.running);
      btn.textContent = state.running ? "Pause" : "Start";
    });
    subscribePomodoro(widgetId, () => {
      btn.textContent = state.running ? "Pause" : "Start";
    });
    root.appendChild(btn);
    return root;
  }

  const hint = document.createElement("p");
  hint.className = "ks-settings-hint";
  hint.textContent = `${workMin}m focus / ${breakMin}m break — timer keeps running while you edit`;
  root.appendChild(hint);
  return root;
}
