import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
      // 123 occurrences at adoption time; ratchet to error in a follow-up cleanup
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Jest suites mock with require() inside test bodies on purpose
    files: ["src/__tests__/**"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["**/*.js"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
