const config = {
  env: {
    'cypress/globals': true,
    node: true,
    browser: true,
    es6: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  extends: ['airbnb', 'airbnb-typescript', 'prettier'],
  plugins: ['@typescript-eslint', 'cypress', 'prettier'],
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
  },
};

export default config;
