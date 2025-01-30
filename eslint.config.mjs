// module.exports = {
//   env: {
//     browser: true,
//     'cypress/globals': true,
//     es6: true,
//     jest: true,
//     node: true,
//   },
//   extends: ['@geops/eslint-config-react'],
//   parserOptions: {
//     project: './tsconfig.json',
//   },
//   plugins: ['cypress', 'prettier'],
//   rules: {
//     '@typescript-eslint/no-empty-function': 'Off',
//     '@typescript-eslint/no-floating-promises': 'Off',
//     '@typescript-eslint/no-unsafe-argument': 'Off',
//     '@typescript-eslint/no-unsafe-assignment': 'Off',
//     '@typescript-eslint/no-unsafe-call': 'Off',
//     '@typescript-eslint/no-unsafe-member-access': 'Off',
//     '@typescript-eslint/prefer-nullish-coalescing': 'Off',
//     'arrow-body-style': 0,
//     'mocha/no-setup-in-describe': 'Off',
//     'prettier/prettier': 'error',
//     'react/jsx-filename-extension': [
//       1,
//       {
//         extensions: ['.js', '.jsx'],
//       },
//     ],
//   },
// };

import flat from '@geops/eslint-config-react/flat';
export default [
  {
    ignores: ['__mocks__/*', 'src/types/*.d.ts', 'dev.js'],
  },
  ...flat,
];
