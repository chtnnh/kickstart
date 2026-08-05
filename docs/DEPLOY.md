# Deploying kickstart to Cloudflare

Production URL: **https://kickstart.chtnnhfoundation.org**

This guide configures the Worker, custom domain, KV sync storage, edge caching for sub-100ms loads, and Cloudflare Speed Insights (RUM).

## Prerequisites

- Cloudflare account with **chtnnhfoundation.org** on the same account (orange-cloud proxied)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) v4+ (`npm install`)
- Node.js 22+

## One-time setup

### 1. Log in to Cloudflare

```bash
npx wrangler login
npx wrangler whoami
```

### 2. Create KV namespace for encrypted sync

```bash
npm run kv:create
```

Copy the returned `id` into [`wrangler.toml`](../wrangler.toml) as `[[kv_namespaces]].id`.

For local `wrangler dev`, create a preview namespace and set `preview_id`:

```bash
npx wrangler kv namespace create kickstart-sync --preview
```

### 3. Deploy

```bash
npm run build
npm run deploy
```

Wrangler attaches the custom domain `kickstart.chtnnhfoundation.org` automatically (`custom_domain = true` in `wrangler.toml`). DNS is created in the **chtnnhfoundation.org** zone if it does not already exist.

Verify:

```bash
curl -sI https://kickstart.chtnnhfoundation.org/ | head
```

### 4. Cloudflare Speed Insights (Web Analytics)

Speed Insights uses a lightweight RUM beacon (`beacon.min.js`) loaded **after idle** so it does not block first paint.

1. Dashboard → **Analytics & logs** → **Web Analytics** → **Add a site**
2. Choose hostname **kickstart.chtnnhfoundation.org** (or add manually)
3. Select **Enable with JS Snippet installation** (we inject the snippet ourselves — do not use auto-inject to avoid duplicate beacons)
4. Copy the **token** from **Manage site**

Set the token for production builds:

**Local / manual deploy:**

```bash
export VITE_CF_WEB_ANALYTICS_TOKEN="your_token_here"
npm run build && npm run deploy
```

**GitHub Actions:** add repository secret `CF_WEB_ANALYTICS_TOKEN`.

View metrics: **Web Analytics** dashboard and **Speed** → **Observatory** (Real User Monitoring).

## Performance architecture (p99 &lt; 100ms target)

| Layer | What we do |
|-------|------------|
| **Asset Worker** | `run_worker_first = ["/api/sync/*"]` — HTML/JS/CSS skip the User Worker and are served from the edge |
| **`_headers`** | Hashed `/assets/*` → `immutable` 1y cache; `index.html` → `no-cache` |
| **Bundle** | Vite code-splitting (`tree`, `sync` chunks); no framework runtime |
| **PWA** | Service worker caches static assets after first visit |
| **Worker** | Sync API only — minimal cold-start surface |

### Recommended Cloudflare dashboard settings

On **chtnnhfoundation.org** (zone) and/or the Worker:

- **Speed** → Optimization: enable **Brotli**, **HTTP/2**, **HTTP/3 (QUIC)**, **Early Hints**
- **SSL/TLS**: Full (strict)
- **Caching** → Tiered Cache: enabled (Enterprise/Business) if available

### Measuring p99

1. **Web Analytics / Speed Insights** — Core Web Vitals and page load time (RUM)
2. **Workers Observability** — invocation duration for `/api/sync/*` (enabled in `wrangler.toml`)
3. **curl TTFB** (rough smoke test):

   ```bash
   curl -o /dev/null -s -w 'TTFB: %{time_starttransfer}s\n' https://kickstart.chtnnhfoundation.org/
   ```

   Expect low tens of ms from edge locations; p99 RUM is tracked in the dashboard after traffic accumulates.

> **Note:** Sub-100ms **p99 document load** depends on client geography and network. Edge-cached static assets typically achieve single-digit ms TTFB; full load includes JS parse on the client. Use Speed Insights p99 as the source of truth.

## CI/CD (GitHub Actions)

Deploys run **only when you push a version tag** (e.g. `v1.0.0`), not on every commit to `main`.

```bash
# ship a release
git tag v1.0.0
git push origin v1.0.0
```

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

### What to create in Cloudflare (one-time)

| Resource | How | Notes |
|----------|-----|-------|
| **Zone** | Already have `chtnnhfoundation.org` | Must be on the same account as the Worker |
| **KV namespace** | `npm run kv:create` or Dashboard → Storage → KV → Create | Namespace name `kickstart-sync`; Worker binding `SYNC`; paste `id` into `wrangler.toml` |
| **API token** | Dashboard → My Profile → API Tokens → Create Token | See permissions below |
| **Account ID** | Dashboard → any zone → right sidebar **Account ID** | Used by Wrangler in CI |
| **Web Analytics** (optional) | Analytics & logs → Web Analytics → Add site | Token → GitHub secret `CF_WEB_ANALYTICS_TOKEN` |

**First deploy** also registers the Worker and custom domain `kickstart.chtnnhfoundation.org` (DNS record created automatically if missing).

#### API token permissions

Create a **Custom token** with:

| Permission | Resource | Access |
|------------|----------|--------|
| Account → Workers Scripts | Account `<your account>` | Edit |
| Account → Workers KV Storage | Account `<your account>` | Edit |
| Account → Workers Routes | Account `<your account>` | Edit |
| Zone → DNS | Zone `chtnnhfoundation.org` | Edit |

(Account Settings → Read is helpful but often not required.)

Alternative: start from the **Edit Cloudflare Workers** template and add **DNS Edit** on `chtnnhfoundation.org`.

### What to configure on GitHub

Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Required | Where to get it |
|--------|----------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token (above) |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare dashboard sidebar |
| `CF_WEB_ANALYTICS_TOKEN` | No | Web Analytics → Manage site → JS snippet token |

No GitHub **variables** are required; KV namespace id lives in committed `wrangler.toml`.

### Release checklist

1. Merge changes to `main`
2. Bump `version` in `package.json` if you track it there
3. `git tag vX.Y.Z && git push origin vX.Y.Z`
4. Watch **Actions** tab → **Deploy** workflow
5. Verify `https://kickstart.chtnnhfoundation.org`

## Local development

```bash
npm run dev          # Vite only
npm run cf:dev       # Wrangler + assets + local KV
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Custom domain 522/525 | Check SSL mode; ensure zone is proxied |
| Sync 500 | Verify KV `id` in `wrangler.toml` |
| Duplicate analytics beacons | Disable auto-inject in Web Analytics; use our env token only |
| Stale assets after deploy | Hard refresh; `index.html` is `no-cache` — SW updates via `autoUpdate` |
