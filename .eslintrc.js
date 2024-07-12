module.exports = {
  env: {
    'cypress/globals': true,
    node: true,
    browser: true,
    es6: true,
    jest: true,
  },
  extends: ['@geops/eslint-config-react'],
  plugins: ['cypress', 'prettier'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'arrow-body-style': 0,
    'react/jsx-filename-extension': [
      1,
      {
        extensions: ['.js', '.jsx'],
      },
    ],
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'Off',
    '@typescript-eslint/no-empty-interface': 'Off',
    '@typescript-eslint/no-empty-function': 'Off',
    '@typescript-eslint/no-redundant-type-constituents': 'Off',
    '@typescript-eslint/prefer-nullish-coalescing': 'Off',
    '@typescript-eslint/no-unsafe-argument': 'Off',
    '@typescript-eslint/no-unsafe-member-access': 'Off',
    '@typescript-eslint/no-unsafe-call': 'Off',
    '@typescript-eslint/no-unsafe-return': 'Off',
    '@typescript-eslint/no-explicit-any': 'Off',
    '@typescript-eslint/no-floating-promises': 'Off',
    '@typescript-eslint/unbound-method': 'Off',
    '@typescript-eslint/prefer-for-of': 'Off',
    'perfectionist/sort-intersection-types': 'Off',
  },
};
