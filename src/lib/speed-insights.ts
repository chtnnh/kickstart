/**
 * Cloudflare Web Analytics / Speed Insights (RUM beacon).
 * Loaded on idle so it does not compete with first paint.
 * @see https://developers.cloudflare.com/speed/speed-insights/
 */
export function initSpeedInsights(config?: { privacy?: { analytics?: boolean } }): void {
  if (config?.privacy?.analytics === false) return;
  const token = import.meta.env.VITE_CF_WEB_ANALYTICS_TOKEN;
  if (!token) return;

  const load = () => {
    if (document.querySelector('script[data-cf-beacon]')) return;
    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.setAttribute("data-cf-beacon", JSON.stringify({ token }));
    document.head.appendChild(script);
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(load, { timeout: 3000 });
  } else {
    globalThis.setTimeout(load, 1);
  }
}
