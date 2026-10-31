import config from "@sms/config/eslint/node";

export default [
  ...config,
  {
    files: ["src/modules/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*/*.repository", "../*/*.repository.js"],
              message: "Import another module's service, not its repository (ADR 0001)",
            },
          ],
        },
      ],
    },
  },
];
