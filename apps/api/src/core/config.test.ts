import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("applies defaults when nothing is set", () => {
    const config = loadConfig({});
    expect(config.NODE_ENV).toBe("development");
    expect(config.API_PORT).toBe(4000);
    expect(config.LOG_LEVEL).toBe("info");
  });

  it("parses valid overrides", () => {
    const config = loadConfig({ NODE_ENV: "production", API_PORT: "8080", LOG_LEVEL: "debug" });
    expect(config.NODE_ENV).toBe("production");
    expect(config.API_PORT).toBe(8080);
    expect(config.LOG_LEVEL).toBe("debug");
  });

  it("throws a readable error for an invalid API_PORT", () => {
    expect(() => loadConfig({ API_PORT: "not-a-number" })).toThrow(/API_PORT/);
  });

  it("throws a readable error for an invalid LOG_LEVEL", () => {
    expect(() => loadConfig({ LOG_LEVEL: "verbose" })).toThrow(/LOG_LEVEL/);
  });
});
