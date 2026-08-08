/** Run after first paint / idle — keeps widgets off the critical path. */
export function loadWhenIdle(fn: () => void, timeoutMs = 3000): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(fn, { timeout: timeoutMs });
  } else {
    setTimeout(fn, 1);
  }
}
