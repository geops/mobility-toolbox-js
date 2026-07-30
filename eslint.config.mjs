import flat from "@geops/eslint-config-react";
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
