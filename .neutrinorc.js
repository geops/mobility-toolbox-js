const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const library = require('@neutrinojs/library');
const jest = require('@neutrinojs/jest');
const copy = require('@neutrinojs/copy');
const styles = require('@neutrinojs/style-loader');
const merge = require('deepmerge');
const path = require('path');

const webpackDevServer = (neutrino) => {
  neutrino.config.watchOptions({
    ignored: /node_modules/,
  });
};

if (process.env.REACT_APP_LIB_MODE) {
  module.exports = {
    options: {
      root: __dirname,
      mains: {
        index: './index.js',
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
        targets: {
          browsers: [
            'last 2 Chrome versions',
            'last 2 Firefox versions',
            'last 2 Edge versions',
            'last 2 Opera versions',
            'last 2 Safari versions',
            'last 2 iOS versions',
            'ie 11',
          ],
        },
      }),
      jest({
        testRegex: 'src/.*.test.js$',
        coveragePathIgnorePatterns: ['src/doc/'],
        coverageReporters: ['text', 'html'],
        snapshotSerializers: ['jest-serializer-html'],
        setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
        globalSetup: './global-setup.js',
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
      webpackDevServer,
      copy({
        patterns: [
          {
            from: path.join(__dirname, 'README.md'),
            to: path.join(__dirname, 'build/README.md'),
          },
          {
            from: path.join(__dirname, 'src/api'),
            to: path.join(__dirname, 'build/api'),
          },
          {
            from: path.join(__dirname, 'src/common'),
            to: path.join(__dirname, 'build/common'),
          },
          {
            from: path.join(__dirname, 'src/ol'),
            to: path.join(__dirname, 'build/ol'),
          },
          {
            from: path.join(__dirname, 'src/mapbox'),
            to: path.join(__dirname, 'build/mapbox'),
          },
          {
            from: path.join(__dirname, 'package.json'),
            to: path.join(__dirname, 'build/package.json'),
          },
          {
            from: path.join(__dirname, 'src/index.js'),
            to: path.join(__dirname, 'build/module.js'),
          },
        ],
      }),
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
          favicon: 'src/doc/img/favico.ico',
        },
        targets: {
          browsers: [
            'last 2 Chrome versions',
            'last 2 Firefox versions',
            'last 2 Edge versions',
            'last 2 Opera versions',
            'last 2 Safari versions',
            'last 2 iOS versions',
            'ie 11',
          ],
        },
        style: {
          // Override the default file extension of `.css` if needed
          test: /\.(css|sass|scss)$/,
          modulesTest: /\.module\.(css|sass|scss)$/,
          loaders: [
            // Define loaders as objects. Note: loaders must be specified in reverse order.
            // ie: for the loaders below the actual execution order would be:
            // input file -> sass-loader -> postcss-loader -> css-loader -> style-loader/mini-css-extract-plugin
            {
              loader: 'postcss-loader',
              options: {
                plugins: [require('autoprefixer')],
              },
            },
            {
              loader: 'sass-loader',
              useId: 'sass',
            },
          ],
        },
      }),
      jest(),
      webpackDevServer,
      copy({
        patterns: [
          {
            from: path.join(__dirname, 'README.md'),
            to: path.join(__dirname, 'build/README.md'),
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
