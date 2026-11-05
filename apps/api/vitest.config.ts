import { configDefaults, defineConfig } from "vitest/config";

/** `pnpm test`: unit tests only, no database needed. Integration tests run separately (vitest.integration.config.ts). */
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
