export const MAX_BLOB_SIZE = 102_400;

export function parseSyncIdFromPath(pathname: string): string {
  return pathname.replace("/api/sync/", "").trim();
}

export function isValidSyncId(syncId: string): boolean {
  return syncId.length > 0 && syncId.length <= 64 && /^[a-zA-Z0-9-]+$/.test(syncId);
}

export function validateSyncPayload(body: string): { ok: true } | { ok: false; status: number; message: string } {
  if (body.length > MAX_BLOB_SIZE) {
    return { ok: false, status: 413, message: "Payload too large" };
  }
  try {
    JSON.parse(body);
    return { ok: true };
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON" };
  }
}
