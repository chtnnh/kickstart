/** First-party Umami proxy path (see worker/umami-proxy.ts). */
export const UMAMI_PROXY_PREFIX = "/stats";

export type AnalyticsConfig = {
  privacy?: { analytics?: boolean };
};

export function initAnalytics(config?: AnalyticsConfig): void {
  if (config?.privacy?.analytics === false) return;
  initUmami();
  void import("./speed-insights.ts").then((m) => m.initSpeedInsights(config));
}

function initUmami(): void {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (!websiteId) return;

  const load = () => {
    if (document.querySelector(`script[src="${UMAMI_PROXY_PREFIX}/script.js"]`)) return;
    const script = document.createElement("script");
    script.defer = true;
    script.src = `${UMAMI_PROXY_PREFIX}/script.js`;
    script.setAttribute("data-website-id", websiteId);
    script.setAttribute("data-host-url", UMAMI_PROXY_PREFIX);
    document.head.appendChild(script);
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(load, { timeout: 3000 });
  } else {
    globalThis.setTimeout(load, 1);
  }
}
