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
];
