import { describe, expect, it } from "vitest";
import { normalizeCalcExpression, tryEvaluateCalc } from "./calc.ts";

describe("calc", () => {
  it("evaluates basic arithmetic", () => {
    expect(tryEvaluateCalc("=2+2")).toBe(4);
    expect(tryEvaluateCalc("= 10 / 4")).toBe(2.5);
  });

  it("supports power and multiply aliases", () => {
    expect(tryEvaluateCalc("=2^8")).toBe(256);
    expect(tryEvaluateCalc("=5×3")).toBe(15);
    expect(tryEvaluateCalc("=4 x 2")).toBe(8);
  });

  it("normalizes operators", () => {
    expect(normalizeCalcExpression("2^3")).toBe("2**3");
    expect(normalizeCalcExpression("5×2")).toBe("5*2");
  });

  it("rejects invalid expressions", () => {
    expect(tryEvaluateCalc("hello")).toBeNull();
    expect(tryEvaluateCalc("=alert(1)")).toBeNull();
    expect(tryEvaluateCalc("=2;3")).toBeNull();
    expect(tryEvaluateCalc("=(1")).toBeNull();
  });
});
