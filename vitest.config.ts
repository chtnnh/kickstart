import { defineConfig } from "vitest/config";

const logicModules = [
  "src/config/**/*.ts",
  "src/search/**/*.ts",
  "src/tree/actions.ts",
  "src/tree/validate.ts",
  "src/tree/undo.ts",
  "src/tree/collapse-state.ts",
  "src/tree/bookmark-import.ts",
  "src/settings/theme-editor.ts",
  "src/themes/presets.ts",
  "src/widgets/search-presets.ts",
  "src/widgets/search-utils.ts",
  "src/widgets/pomodoro-state.ts",
  "src/lib/toast.ts",
  "src/lib/timezones.ts",
  "src/lib/pwa-install.ts",
  "src/lib/keyboard.ts",
  "worker/sync-utils.ts",
];

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.behavior.test.ts", "worker/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: logicModules,
      exclude: [
        "**/*.test.ts",
        "**/*.behavior.test.ts",
        "src/themes/starttree-palettes.ts",
      ],
      thresholds: {
        lines: 97,
        functions: 98,
        statements: 97,
        branches: 85,
      },
    },
  },
});
