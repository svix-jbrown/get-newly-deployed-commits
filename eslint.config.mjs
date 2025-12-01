import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["**/coverage", "**/dist", "**/linter", "**/node_modules"]),
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js, prettier },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2023,
      sourceType: "module",
    },
    rules: {
      "eslint-comments/no-use": "off",
      "eslint-comments/no-unused-disable": "off",
      "i18n-text/no-en": "off",
      "import/no-namespace": "off",
      "no-console": "off",
      "prettier/prettier": "error",
    },
  },
]);
