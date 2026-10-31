import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Shared ESLint config for Node packages (api, contracts). */
export default [
  { ignores: ["dist/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
