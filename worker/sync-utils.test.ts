import { describe, expect, it } from "vitest";
import {
  isValidSyncId,
  parseSyncIdFromPath,
  validateSyncPayload,
  MAX_BLOB_SIZE,
} from "./sync-utils.ts";

describe("sync utils", () => {
  it("parses sync id from path", () => {
    expect(parseSyncIdFromPath("/api/sync/abc-123")).toBe("abc-123");
  });

  it("validates sync ids", () => {
    expect(isValidSyncId("valid-id-1")).toBe(true);
    expect(isValidSyncId("")).toBe(false);
    expect(isValidSyncId("bad id")).toBe(false);
    expect(isValidSyncId("a".repeat(65))).toBe(false);
  });

  it("validates JSON payload size and shape", () => {
    expect(validateSyncPayload('{"ok":true}')).toEqual({ ok: true });
    expect(validateSyncPayload("not-json").ok).toBe(false);
    expect(validateSyncPayload("x".repeat(MAX_BLOB_SIZE + 1)).ok).toBe(false);
  });
});
