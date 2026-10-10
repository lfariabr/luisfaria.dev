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
      // Resolvers throw through the shared factories; see CODING_STANDARDS.md "Errors"
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='GraphQLError']",
          message: "Throw Errors.* or createGraphQLError from utils/errors instead of a raw GraphQLError.",
        },
      ],
    },
  },
  {
    // The error infrastructure itself, plus shield/validation middleware that must return (not throw) errors
    files: ["src/utils/errors/**", "src/validation/shield.ts", "src/validation/middleware.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Rate-limit sites that predate the factories; migrate to Errors.rateLimited in the rate-limiting work
    files: ["src/middleware/rateLimiter.ts", "src/utils/applyRateLimit.ts", "src/resolvers/screams/mutations.ts"],
    rules: { "no-restricted-syntax": "off" },
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
