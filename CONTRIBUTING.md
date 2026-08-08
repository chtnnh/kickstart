# Contributing to kickstart

Thanks for helping improve kickstart! This project is a modern reimplementation of the [StartTreeV2](https://github.com/AlexW00/StartTreeV2) start page — please keep changes focused, tested, and respectful of upstream attribution (see [ATTRIBUTION.md](ATTRIBUTION.md)).

## Getting started

```bash
git clone <your-fork-url>
cd kickstart
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
```

## Testing

```bash
npm test           # unit + behavioral (Vitest)
npm run test:e2e   # Playwright browser tests
```

## What to work on

- Bug fixes and UX polish
- Widgets, layout, themes, import/export, sync
- Documentation and accessibility
- Performance (bundle size, PWA, Worker caching)

Please open an issue before large changes so we can align on approach.

## Pull request checklist

- [ ] `npm run build` passes
- [ ] `npm test` passes (unit + behavioral)
- [ ] `npm run test:e2e` passes when UI flows change
- [ ] Change is scoped to the problem (no drive-by refactors)
- [ ] UI changes tested in view mode **and** edit mode
- [ ] New themes documented in [ATTRIBUTION.md](ATTRIBUTION.md)
- [ ] Third-party code retains license/attribution headers

## Code conventions

After `npm run build`, the main entry chunk should stay **under 15 KB gzip** (check `dist/assets/` or run `npm run analyze` for `dist/stats.html`). Lazy-loaded chunks (settings, tree, cmd) are excluded from this budget.

- **TypeScript** — strict types, minimal `any`
- **Vanilla DOM** — no framework; match existing patterns in `src/`
- **CSS** — use theme tokens (`--color*`, `--ks-*`); avoid hardcoded colors in components
- **Config** — extend `src/config/types.ts` and defaults/migrations when schema changes

## Adding a theme

Themes use the StartTreeV2 16-color + background/foreground/cursor format.

### 1. Source colors

Either:

- Port an existing [StartTreeV2 theme CSS](https://github.com/AlexW00/StartTreeV2/tree/master/themes) file, **or**
- Create a new palette following the same `--color0` … `--color15` structure

If based on an existing scheme (Catppuccin, Nord, Gruvbox, etc.), note the upstream in your PR.

### 2. Register the palette

Add the theme to `src/themes/starttree-palettes.ts`:

```ts
"my-theme": {
  background: "#...",
  foreground: "#...",
  cursor: "#...",
  color0: "#...",
  // ... color1 through color15
},
```

Add the id to `STARTTREE_THEME_ORDER` in `src/themes/presets.ts` (order matters for StartTreeV2 import index compatibility — **append new themes at the end** unless intentionally matching upstream).

### 3. Attribution

Update [ATTRIBUTION.md](ATTRIBUTION.md) with:

- Theme id and display name
- Your name / GitHub handle
- Upstream palette credit (if any)
- `pywal` credit if wallpaper-generated

### 4. Test

- Select the theme in Settings → Appearance
- Check tree lines, links, prompts, search icons, widgets, and settings panel contrast

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml). Include browser, steps to reproduce, and screenshots if UI-related.

## Proposing themes

Use the [theme request template](.github/ISSUE_TEMPLATE/theme_request.yml) or submit a PR with the palette + attribution.

## StartTreeV2 upstream

Many themes and UI ideas belong upstream too. Consider contributing themes to [StartTreeV2](https://github.com/AlexW00/StartTreeV2) first; we can then port exact hex values from their `themes/` folder.

## Code of conduct

Be kind and constructive. We follow the spirit of open source: credit contributors, document changes, and keep the project maintainable.
