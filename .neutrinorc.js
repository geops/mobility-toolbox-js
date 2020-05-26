const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const library = require('@neutrinojs/library');
const jest = require('@neutrinojs/jest');
const copy = require('@neutrinojs/copy');
const path = require('path');

if (process.env.REACT_APP_LIB_MODE) {
  module.exports = {
    options: {
      root: __dirname,
      mains: {
        index: './index.js',
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
              'max-len': ['error', { 'ignoreComments': true }],
            },
          },
        },
      }),
      react({
        html: {
          title: 'mobility-toolbox-js',
          favicon: 'src/doc/img/favicon.png',
        },
      }),
      jest(),
      copy({
        patterns: [
          {
            from: path.join(__dirname, 'doc'),
            to: path.join(__dirname, 'build/doc'),
          },
          {
            from: path.join(__dirname, 'src/doc/documentation_style.css'),
            to: path.join(__dirname, 'build/doc/assets/style.css'),
          },
          {
            from: path.join(__dirname, 'src/doc/examples'),
            to: path.join(__dirname, 'build/examples'),
          },
        ],
      }),
    ],
  };
}
