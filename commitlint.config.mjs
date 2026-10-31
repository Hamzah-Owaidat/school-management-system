export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "chore",
        "test",
        "refactor",
        "perf",
        "ci",
        "build",
        "style",
        "revert",
      ],
    ],
  },
};
