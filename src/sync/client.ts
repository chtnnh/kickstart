import type { EncryptedBlob } from "./crypto.ts";

const API_BASE = "/api/sync";

export async function pushSync(syncId: string, blob: EncryptedBlob): Promise<void> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(syncId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blob),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Sync push failed (${res.status})`);
  }
}

export async function pullSync(syncId: string): Promise<EncryptedBlob | null> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(syncId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Sync pull failed (${res.status})`);
  }
  return (await res.json()) as EncryptedBlob;
}
