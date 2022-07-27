/** @type {import('next').NextConfig} */

const withTM = require('next-transpile-modules')(['mobility-toolbox-js']);

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(md|html)$/,
      use: 'raw-loader',
    });

    return config;
  },
};

module.exports = withTM(nextConfig);
