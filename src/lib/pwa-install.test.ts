import { describe, expect, it } from "vitest";
import { canInstallPwa } from "./pwa-install.ts";

describe("pwa install", () => {
  it("reports unavailable before prompt", () => {
    expect(canInstallPwa()).toBe(false);
  });
});
