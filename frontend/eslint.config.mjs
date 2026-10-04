import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "coverage/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
  {
    rules: {
      "no-console": "warn",
    },
  },
  {
    files: ["*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
