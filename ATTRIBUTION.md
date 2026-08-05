# Attribution & third-party credits

kickstart builds on several open-source projects and community-contributed themes.  
**Thank you to everyone listed below.**

For license terms covering kickstart’s own code, see [LICENSE](LICENSE).

---

## Core inspirations & upstream projects

| Project | Author / maintainer | Role in kickstart | Link |
|---------|---------------------|-------------------|------|
| **StartTreeV2** | [AlexW00](https://github.com/AlexW00) (Alexander Weichart) | Tree UI patterns, branch-line styling, theme palette CSS, JSURL config format, search layout | [github.com/AlexW00/StartTreeV2](https://github.com/AlexW00/StartTreeV2) |
| **StartTree** | [Paul-Houser](https://github.com/Paul-Houser) | Original `$ tree` start-page concept that StartTreeV2 extends | [github.com/Paul-Houser/StartTree](https://github.com/Paul-Houser/StartTree) |
| **JSURL** | [Bruno Jouhier](https://github.com/bjouhier) | URL-safe JSON encoding/decoding (`src/config/jsurl.ts`, MIT) | Used via StartTreeV2 |
| **Simple Icons** | Simple Icons contributors | Official brand SVG paths for search presets (MIT) | [simpleicons.org](https://simpleicons.org/) |
| **pywal** | [Dylan Apsaras](https://github.com/dylanaraps) | Several StartTreeV2 themes were generated with pywal from wallpaper colors | [github.com/dylanaraps/pywal](https://github.com/dylanaraps/pywal) |

---

## Theme palettes

kickstart ships the **28 color themes** from [StartTreeV2 `themes/`](https://github.com/AlexW00/StartTreeV2/tree/master/themes), ported to `src/themes/starttree-palettes.ts`.

Each row lists:

- **Theme** — preset id in kickstart (matches StartTreeV2 filename)
- **StartTreeV2 contributor** — git author who added the theme file (from upstream history)
- **Palette / notes** — original color scheme or generation method, where known

| Theme | StartTreeV2 contributor | Palette / notes |
|-------|-------------------------|-----------------|
| `black-ice` | AlexW00 | Community / StartTreeV2 palette |
| `carnival` | AlexW00 | Community / StartTreeV2 palette |
| `cotton-candy` | AlexW00 | Community / StartTreeV2 palette |
| `desert-sky` | AlexW00 | Community / StartTreeV2 palette |
| `ferns` | AlexW00 | Community / StartTreeV2 palette |
| `forest` | AlexW00 | Community / StartTreeV2 palette |
| `gruvbox` | [kkYrusobad](https://github.com/kkYrusobad) | [Gruvbox](https://github.com/morhetz/gruvbox) by Pavel Sudarikov |
| `intrigue` | AlexW00 | Community / StartTreeV2 palette |
| `just-red` | AlexW00 | Community / StartTreeV2 palette |
| `neon-pink-dark` | AlexW00 | Community / StartTreeV2 palette |
| `neon` | AlexW00 | Community / StartTreeV2 palette |
| `orange-dark` | AlexW00 | Community / StartTreeV2 palette |
| `slick-red` | AlexW00 | Community / StartTreeV2 palette |
| `this-ones-good` | AlexW00 | Community / StartTreeV2 palette |
| `tomorrow-night-eighties` | AlexW00 | [Tomorrow Theme](https://github.com/chriskempson/tomorrow-theme) (Eighties) by Chris Kempson |
| `void` | AlexW00 | Community / StartTreeV2 palette |
| `water-fire` | AlexW00 | Community / StartTreeV2 palette |
| `storm` | AlexW00 | pywal-generated (wallpaper-derived colors) |
| `gold-hunter` | AlexW00 | pywal-generated |
| `sierra` | AlexW00 | pywal-generated |
| `capitane` | AlexW00 | pywal-generated ([Capitaine](https://github.com/keeferrourke/capitaine-cursors)-inspired wallpaper theme) |
| `bigsur` | AlexW00 | pywal-generated (macOS Big Sur–inspired wallpaper) |
| `monterey` | AlexW00 | pywal-generated (macOS Monterey–inspired wallpaper) |
| `nord` | [thecashewtrader](https://github.com/thecashewtrader) | [Nord](https://www.nordtheme.com/) by Arctic Ice Studio |
| `MonokaiPro` | [Sachit Yadav](https://github.com/sachit27) | [Monokai Pro](https://monokai.pro/) by Monokai |
| `Programiz` | Sachit Yadav | Custom light theme for [Programiz](https://www.programiz.com/) |
| `autumn-mech` | Alexander Weichart (AlexW00) | Original StartTreeV2 theme |
| `catppuccin` | William (StartTreeV2 contributor) | [Catppuccin](https://github.com/catppuccin/catppuccin) by Catppuccin contributors |

### Named color schemes (referenced by multiple themes)

| Scheme | Authors / rights holders | Link |
|--------|--------------------------|------|
| **Catppuccin** | Catppuccin contributors | [github.com/catppuccin/catppuccin](https://github.com/catppuccin/catppuccin) |
| **Gruvbox** | Pavel Sudarikov | [github.com/morhetz/gruvbox](https://github.com/morhetz/gruvbox) |
| **Nord** | Arctic Ice Studio | [nordtheme.com](https://www.nordtheme.com/) |
| **Monokai Pro** | Monokai | [monokai.pro](https://monokai.pro/) |
| **Tomorrow** (Night / Eighties) | Chris Kempson | [github.com/chriskempson/tomorrow-theme](https://github.com/chriskempson/tomorrow-theme) |

---

## Code & style ports

| File / area | Source | Notes |
|-------------|--------|-------|
| `src/config/jsurl.ts` | StartTreeV2 / Bruno Jouhier | JSURL parse/stringify |
| `src/styles/tree.css` | StartTreeV2 tree styles | Branch lines, prompt typography |
| `src/themes/starttree-palettes.ts` | StartTreeV2 `themes/*.css` | Exact hex values from upstream CSS |
| `src/widgets/search-icons.ts` | Simple Icons | Paths tinted with `currentColor` |

---

## Adding a theme?

Please credit:

1. Yourself as the kickstart / StartTreeV2 contributor
2. Any **upstream palette** (e.g. Catppuccin, Nord) if your theme is based on one
3. **pywal** if you generated colors from a wallpaper

See [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-theme).

---

## Missing credit?

If you authored a theme or contributed code and are not listed correctly, please open an issue or PR to update this file. We want every contributor named.
