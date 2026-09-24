import flat from "@geops/eslint-config-react";
import globals from "globals";
export default [
  {
    ignores: [
      "build/*",
      "__mocks__/*",
      "dev.js",
      "doc/**/*",
      "./eslint.config.mjs",
      "*.test.js",
    ],
  },
  ...flat,
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "warn",
      "arrow-body-style": ["error", "always"],
      curly: ["error", "all"],
    },
  },
  {
    files: ["src/types/**/*.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/setupTests.js", "**/*.test.js"],
    languageOptions: {
      globals: {
        global: "readonly",
        ...globals.jest, // Adds describe, test, expect, jest, etc.
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
