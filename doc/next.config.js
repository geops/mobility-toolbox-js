/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ['mobility-toolbox-js'],
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(md|html)$/,
      use: 'raw-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
