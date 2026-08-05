export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/sync/")) {
      return handleSync(request, env, url);
    }

    // Static assets are served by the Assets binding (run_worker_first routes only /api/sync/* here)
    return env.ASSETS.fetch(request);
  },
};

export interface Env {
  SYNC: KVNamespace;
  ASSETS: Fetcher;
}

const MAX_BLOB_SIZE = 102_400; // 100KB
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;

const rateBuckets = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + RATE_LIMIT_WINDOW };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  return bucket.count <= RATE_LIMIT_MAX;
}

async function handleSync(request: Request, env: Env, url: URL): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const syncId = url.pathname.replace("/api/sync/", "").trim();
  if (!syncId || syncId.length > 64 || !/^[a-zA-Z0-9-]+$/.test(syncId)) {
    return new Response("Invalid sync ID", { status: 400 });
  }

  if (request.method === "GET") {
    const blob = await env.SYNC.get(syncId);
    if (!blob) return new Response("Not found", { status: 404 });
    return new Response(blob, {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "PUT") {
    const body = await request.text();
    if (body.length > MAX_BLOB_SIZE) {
      return new Response("Payload too large", { status: 413 });
    }
    try {
      JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    await env.SYNC.put(syncId, body);
    return new Response("OK", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
}
