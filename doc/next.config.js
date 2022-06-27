const withTM = require('next-transpile-modules')(['@geops/geops-ui', 'ol']);

/** @type {import('next').NextConfig} */
const nextConfig = withTM({
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.url\.svg$/,
      use: ['file-loader'],
    });
    config.module.rules.push({
      test: /^((?!url).)*\.svg/,
      use: ['@svgr/webpack'],
    });
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });
    config.module.rules.push({
      test: /\.html$/,
      use: 'raw-loader',
    });

    return config;
  },
});

module.exports = nextConfig;
