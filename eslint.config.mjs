import flat from '@geops/eslint-config-react/flat';
export default [
  {
    ignores: [
      'build/*',
      '__mocks__/*',
      'src/types/*.d.ts',
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
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'mocha/no-setup-in-describe': 'off',
      'mocha/consistent-spacing-between-blocks': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      'mocha/no-pending-tests': 'off',
    },
  },
];
