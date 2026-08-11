import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  server: {
    proxy: {
      "/stats": {
        target: "https://umami.chtnnhfoundation.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stats/, ""),
      },
    },
  },
  build: {
    target: "es2022",
    cssMinify: true,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/src/themes/starttree-palettes")) return "palettes";
          if (id.includes("/src/tree/")) return "tree";
          if (id.includes("/src/sync/")) return "sync";
          if (id.includes("/src/settings/")) return "settings";
          if (id.includes("/src/onboarding/")) return "onboarding";
          if (id.includes("/src/lib/command-palette")) return "cmd";
        },
      },
    },
  },
  plugins: [
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: "dist/stats.html",
            gzipSize: true,
            open: false,
          }),
        ]
      : []),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "kickstart",
        short_name: "kickstart",
        description: "Fast private new-tab start page",
        theme_color: "#1e1e2e",
        background_color: "#1e1e2e",
        display: "standalone",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\./,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 10 } },
          },
        ],
      },
    }),
  ],
});
