// eslint.config.js (in repo root)
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/coverage/**",
      "**/next-env.d.ts",
      "**/plopfile.ts"
    ]
  },

  // Next-specific rules for web
  ...compat.extends("next/core-web-vitals", "next/typescript").map(cfg => ({
    ...cfg,
    files: ["apps/web/**/*.{ts,tsx}"]
  })),

  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },

  eslintConfigPrettier
];
