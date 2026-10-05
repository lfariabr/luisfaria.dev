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
      // `({ node, ...props })` deliberately strips props before spreading onto DOM elements
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },
  {
    // Test setup, Sentry bootstrapping and the Sentry debug route/page log on purpose
    files: ["jest.setup.js", "sentry.*.config.ts", "src/app/api/test-sentry/**", "src/app/test-sentry/**"],
    rules: {
      "no-console": "off",
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
