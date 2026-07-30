import flat from '@geops/eslint-config-react';
export default [
  {
    ignores: [
      'build/*',
      '__mocks__/*',
      'src/types/stops.d.ts',
      'src/types/routing.d.ts',
      'src/types/moco.d.ts',
      'dev.js',
      'doc/**/*',
      './eslint.config.mjs',
      '*.test.js',
      '*.d.ts',
    ],
  },
  ...flat,
  {
    rules: {},
  },
  {
    files: ['src/setupTests.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        global: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
];
