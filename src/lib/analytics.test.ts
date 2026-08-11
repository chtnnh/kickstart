import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./speed-insights.ts", () => ({
  initSpeedInsights: vi.fn(),
}));

import { initAnalytics, UMAMI_PROXY_PREFIX } from "./analytics.ts";

describe("analytics", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "test-website-id");
    vi.stubEnv("VITE_CF_WEB_ANALYTICS_TOKEN", "");
    vi.stubGlobal(
      "requestIdleCallback",
      (cb: IdleRequestCallback) => {
        cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
        return 1;
      },
    );
    document.head.innerHTML = "";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    document.head.innerHTML = "";
  });

  it("loads umami from the first-party proxy path", () => {
    initAnalytics({ privacy: { analytics: true } });
    const script = document.querySelector(
      `script[src="${UMAMI_PROXY_PREFIX}/script.js"]`,
    ) as HTMLScriptElement | null;
    expect(script).toBeTruthy();
    expect(script?.getAttribute("data-website-id")).toBe("test-website-id");
    expect(script?.getAttribute("data-host-url")).toBe(UMAMI_PROXY_PREFIX);
  });

  it("skips loading when analytics is disabled", () => {
    initAnalytics({ privacy: { analytics: false } });
    expect(document.querySelector("script")).toBeNull();
  });

  it("skips umami when website id is unset", () => {
    vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "");
    initAnalytics({ privacy: { analytics: true } });
    expect(document.querySelector("script")).toBeNull();
  });
});
