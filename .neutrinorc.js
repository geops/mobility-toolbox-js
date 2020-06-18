const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const library = require('@neutrinojs/library');
const jest = require('@neutrinojs/jest');
const copy = require('@neutrinojs/copy');
const merge = require('deepmerge');
const path = require('path');

if (process.env.REACT_APP_LIB_MODE) {
  module.exports = {
    options: {
      root: __dirname,
      mains: {
        index: './index.js',
        api: './api/index.js',
        ol: './ol/index.js',
        mapbox: './mapbox/index.js',
        search: './search/index.js',
      },
    },
    use: [
      (neutrino) => {
        neutrino.config.output
          .globalObject('this') // will prevent `window`
          .end()
          .module.rule('worker')
          .test(neutrino.regexFromExtensions(['worker.js']))
          .use('worker')
          .loader(require.resolve('worker-loader'))
          .options({
            // See: https://github.com/webpack-contrib/worker-loader#options
          });
      },
      library({
        name: 'mobility-toolbox-js',
      }),
      jest({
        testRegex: 'src/.*.test.js$',
        coveragePathIgnorePatterns: ['src/doc/'],
        coverageReporters: ['text', 'html'],
        snapshotSerializers: ['jest-serializer-html'],
        setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
      }),
      (neutrino) => {
        if (process.env.NODE_ENV === 'test') {
          neutrino.config.module
            .rule('compile')
            .use('babel')
            .tap((options) =>
              merge(options, {
                env: {
                  test: {
                    plugins: ['@babel/plugin-transform-runtime'], // async/await
                  },
                },
              }),
            );
        }
      },
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
          {
            from: path.join(__dirname, 'src/doc/_redirects'),
            to: path.join(__dirname, 'build/'),
          },
        ],
      }),
      (neutrino) => {
        neutrino.config.output
          .globalObject('this') // will prevent `window`
          .end()
          .module.rule('worker')
          .test(neutrino.regexFromExtensions(['worker.js']))
          .use('worker')
          .loader(require.resolve('worker-loader'))
          .options({
            // See: https://github.com/webpack-contrib/worker-loader#options
          });
      },
    ],
  };
}
