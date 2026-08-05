# kickstart

A fast, private new-tab start page inspired by [StartTreeV2](https://github.com/AlexW00/StartTreeV2) and the original [StartTree](https://github.com/Paul-Houser/StartTree).

- **Stable URL** — config lives in `localStorage`, not the address bar
- **Fast** — Vite bundle, service worker, Cloudflare edge caching
- **Portable** — JSON export/import, StartTreeV2 URL migration
- **Sync** — optional E2E-encrypted cloud sync via Cloudflare Worker + KV
- **Themes** — all 28 StartTreeV2 presets with exact upstream colors
- **Widgets** — search, tree, clock, quote, spacer with zone-based layout

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output to dist/
npm run deploy   # build + wrangler deploy
```

Set your deployed URL (or `http://localhost:5173` while developing) as the browser new-tab page. The URL never changes when you edit bookmarks or themes.

## Cloudflare deployment

Production: **https://kickstart.chtnnhfoundation.org**

Full setup: **[docs/DEPLOY.md](docs/DEPLOY.md)**

**Production deploys** run via GitHub Actions when you push a version tag:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Manual deploy (optional):

```bash
npx wrangler login
npm run kv:create          # paste id into wrangler.toml (one-time)
export VITE_CF_WEB_ANALYTICS_TOKEN="..."   # optional
npm run deploy
```

### Performance

- Static assets bypass the User Worker (`run_worker_first`) and are cached at the edge via `_headers`
- Hashed JS/CSS: `immutable` 1-year cache; HTML: `no-cache`
- Speed Insights beacon loads on `requestIdleCallback` (no blocking on first paint)

### Cache headers

See [`public/_headers`](public/_headers) for asset cache policy. Sync API routes go through the Worker only.

## Config storage

| Key | Purpose |
|-----|---------|
| `kickstart:config` | Full page config (bookmarks, theme, widgets, layout) |
| `kickstart:meta` | Onboarding state (not synced/exported) |

## Import formats

- **JSON** — exported `kickstart-config.json`
- **StartTreeV2 URL** — paste a URL with `?t=~(...)` param
- **Query param** — `?import=<encoded-json-or-url>` for one-time import

## Cloud sync

Sync is passphrase-based and end-to-end encrypted. The server only stores ciphertext.

1. Open Settings → Cloud sync
2. Set a passphrase → **Push to cloud**
3. Save the displayed Sync ID
4. On another device: **Restore from sync** (welcome screen or settings)

## Widgets

| Widget | Default zone | Notes |
|--------|--------------|-------|
| search | top | Preset engines or custom URL; removable |
| tree | main | Always present; not deletable |
| clock | — | Add from Settings; 12h/24h + optional seconds |
| quote | — | Random or custom text |
| spacer | — | Vertical gap |

In edit mode, use the arrow toolbar to move widgets between zones (top → above-tree → main → below-tree → bottom).

## Themes

All **28 themes** from StartTreeV2 are included with colors ported verbatim from upstream CSS. Select one in Settings → Appearance.

See [ATTRIBUTION.md](ATTRIBUTION.md) for per-theme credits (StartTreeV2 contributors, Nord, Gruvbox, Catppuccin, Monokai Pro, pywal-generated themes, etc.).

To add a theme, follow [CONTRIBUTING.md#adding-a-theme](CONTRIBUTING.md#adding-a-theme).

## Project structure

```
src/
  app.ts              # boot, edit mode, settings
  config/             # schema, store, StartTreeV2 migration
  layout/             # zones, widget rendering, move controls
  tree/               # bookmark tree view/edit
  widgets/            # search, clock, quote, spacer
  themes/             # StartTreeV2 palettes + token engine
  sync/               # E2E encrypted Worker client
worker/               # Cloudflare Worker (assets + KV sync API)
```

## Contributing

Contributions welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, theme guidelines, and PR expectations.

## License & attribution

- **kickstart** code: [MIT](LICENSE)
- **StartTreeV2**, **StartTree**, themes, and ported code: see [ATTRIBUTION.md](ATTRIBUTION.md)

If you use or redistribute kickstart, please preserve attribution notices for upstream authors and theme contributors.
