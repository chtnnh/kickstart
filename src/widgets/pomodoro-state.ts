export type PomodoroPhase = "focus" | "break";

export type PomodoroRuntime = {
  secondsLeft: number;
  phase: PomodoroPhase;
  running: boolean;
  workMin: number;
  breakMin: number;
};

export type PomodoroStats = {
  date: string;
  focusSessions: number;
};

const STATS_KEY = "kickstart:pomodoro-stats";
const runtime = new Map<string, PomodoroRuntime>();
const timers = new Map<string, ReturnType<typeof setInterval>>();
const listeners = new Map<string, Set<() => void>>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadPomodoroStats(): PomodoroStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { date: todayKey(), focusSessions: 0 };
    const parsed = JSON.parse(raw) as PomodoroStats;
    if (parsed.date !== todayKey()) return { date: todayKey(), focusSessions: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), focusSessions: 0 };
  }
}

export function recordFocusSession(): PomodoroStats {
  const stats = loadPomodoroStats();
  stats.focusSessions += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

export function getPomodoroRuntime(
  widgetId: string,
  workMin: number,
  breakMin: number,
): PomodoroRuntime {
  const existing = runtime.get(widgetId);
  if (existing && existing.workMin === workMin && existing.breakMin === breakMin) {
    return existing;
  }
  const next: PomodoroRuntime = {
    secondsLeft: workMin * 60,
    phase: "focus",
    running: false,
    workMin,
    breakMin,
  };
  runtime.set(widgetId, next);
  return next;
}

export function subscribePomodoro(widgetId: string, listener: () => void): () => void {
  const set = listeners.get(widgetId) ?? new Set();
  set.add(listener);
  listeners.set(widgetId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(widgetId);
  };
}

function notify(widgetId: string): void {
  listeners.get(widgetId)?.forEach((fn) => fn());
}

export function formatPomodoroTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export type PomodoroTickResult = "continued" | "phase-complete";

export function tickPomodoro(widgetId: string): PomodoroTickResult {
  const state = runtime.get(widgetId);
  if (!state || !state.running) return "continued";
  if (state.secondsLeft > 0) {
    state.secondsLeft -= 1;
    notify(widgetId);
    return "continued";
  }
  const completedPhase = state.phase;
  if (state.phase === "focus") recordFocusSession();
  state.phase = state.phase === "focus" ? "break" : "focus";
  state.secondsLeft = (state.phase === "break" ? state.breakMin : state.workMin) * 60;
  notifyPomodoroPhaseComplete(completedPhase);
  notify(widgetId);
  return "phase-complete";
}

export function setPomodoroRunning(widgetId: string, running: boolean): void {
  const state = runtime.get(widgetId);
  if (!state) return;
  state.running = running;
  if (running) {
    if (!timers.has(widgetId)) {
      timers.set(
        widgetId,
        setInterval(() => tickPomodoro(widgetId), 1000),
      );
    }
  } else {
    const timer = timers.get(widgetId);
    if (timer) {
      clearInterval(timer);
      timers.delete(widgetId);
    }
  }
  notify(widgetId);
}

export function resetPomodoroRuntime(widgetId: string): void {
  setPomodoroRunning(widgetId, false);
  runtime.delete(widgetId);
}

export function notifyPomodoroPhaseComplete(phase: PomodoroPhase): void {
  const title = phase === "focus" ? "Focus session complete" : "Break complete";
  const body = phase === "focus" ? "Time for a break." : "Back to focus.";
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body });
    return;
  }
  if (typeof Notification !== "undefined" && Notification.permission !== "denied") {
    void Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body });
    });
  }
}
