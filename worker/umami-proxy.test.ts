import { describe, expect, it } from "vitest";
import {
  buildUmamiTargetUrl,
  DEFAULT_UMAMI_ORIGIN,
  UMAMI_PROXY_PREFIX,
} from "./umami-proxy.ts";

describe("umami proxy", () => {
  it("builds script.js target URL", () => {
    const target = buildUmamiTargetUrl(`${UMAMI_PROXY_PREFIX}/script.js`, DEFAULT_UMAMI_ORIGIN);
    expect(target?.toString()).toBe("https://umami.chtnnhfoundation.org/script.js");
  });

  it("builds api/send target URL", () => {
    const target = buildUmamiTargetUrl(`${UMAMI_PROXY_PREFIX}/api/send`, DEFAULT_UMAMI_ORIGIN);
    expect(target?.toString()).toBe("https://umami.chtnnhfoundation.org/api/send");
  });

  it("preserves query string on target", () => {
    const target = buildUmamiTargetUrl(`${UMAMI_PROXY_PREFIX}/script.js`, DEFAULT_UMAMI_ORIGIN);
    target!.search = "v=2";
    expect(target?.toString()).toBe("https://umami.chtnnhfoundation.org/script.js?v=2");
  });

  it("returns null for non-proxy paths", () => {
    expect(buildUmamiTargetUrl("/api/sync/foo", DEFAULT_UMAMI_ORIGIN)).toBeNull();
  });
});
