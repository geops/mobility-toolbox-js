import flat from '@geops/eslint-config-react/flat';
export default [
  {
    ignores: [
      'build/*',
      '__mocks__/*',
      'dev.js',
      'doc/**/*',
      './eslint.config.mjs',
      '*.test.js',
      '*.d.ts',
    ],
  },
  ...flat,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    rules: {},
  },
  {
    files: ['src/setupTests.js', '**/*.test.js'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
];
