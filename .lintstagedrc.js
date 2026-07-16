module.exports = {
  '(src|__mocks__)/**/*.js': [
    'eslint --fix',
    'prettier --write',
    'git add',
    'pnpm test --bail --passWithNoTests --findRelatedTests',
  ],
  'package.json': ['fixpack', 'git add'],
  'src/**/*.{css,scss}': ['stylelint --fix --allow-empty-input'],
};
