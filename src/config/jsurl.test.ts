import { describe, expect, it } from "vitest";
import { parse, stringify } from "./jsurl.ts";

describe("jsurl", () => {
  it("round-trips strings with special characters", () => {
    const value = "hello $world";
    expect(parse(stringify(value)!)).toBe(value);
  });

  it("round-trips numbers", () => {
    expect(parse(stringify(42)!)).toBe(42);
    expect(parse(stringify(-3.14)!)).toBe(-3.14);
  });

  it("round-trips booleans and null", () => {
    expect(parse(stringify(true)!)).toBe(true);
    expect(parse(stringify(false)!)).toBe(false);
    expect(parse(stringify(null)!)).toBe(null);
  });

  it("round-trips arrays", () => {
    const arr = [1, "two", false];
    expect(parse(stringify(arr)!)).toEqual(arr);
  });

  it("round-trips objects", () => {
    const obj = { s: { n: "ddg", u: "https://duckduckgo.com/?q=" }, t: { nr: 7 } };
    expect(parse(stringify(obj)!)).toEqual(obj);
  });

  it("parses StartTree-style encoded numbers (regression)", () => {
    expect(parse("~7")).toBe(7);
    expect(parse("~26")).toBe(26);
  });
});
