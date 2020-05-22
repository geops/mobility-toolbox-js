const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const library = require('@neutrinojs/library');
const jest = require('@neutrinojs/jest');
const copy = require('@neutrinojs/copy');

if (process.env.REACT_APP_LIB_MODE) {
  module.exports = {
    options: {
      root: __dirname,
      mains: {
        index: 'index',
      },
    },
    use: [
      library({
        name: 'mobility-toolbox-js'
      }),
      jest(),
    ],
  };
} else {
  module.exports = {
    options: {
      root: __dirname,
      mains: {
        index: 'doc/index.js',
      },
    },
    use: [
      airbnb({
        eslint: {
          baseConfig: {
            rules: {
              'react/jsx-filename-extension': 'Off',
              'react/no-danger': 'Off',
            },
          },
        },
      }),
      react(),
      jest(),
      copy({
        patterns: [
          { from: './src/doc/examples', to: './examples' },
        ],
      }),
    ],
  };
}
