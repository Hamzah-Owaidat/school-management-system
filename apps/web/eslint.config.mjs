import eslintConfigPrettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "out/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
];

export default eslintConfig;
