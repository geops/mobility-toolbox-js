// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
// const config = {
//   transform: {
//     '^.+\\.(js|ts)x?$': 'esbuild-jest',
//   },
//   testEnvironment: 'jsdom',
//   transformIgnorePatterns: ['<rootDir>/node_modules/'],
// };
// jest.config.js
// Add any custom config to be passed to Jest
const config = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jsdom',
  transform: {
    '.+\\.(j|t)s$': ['esbuild-jest'],
  },
  transformIgnorePatterns: [],
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).(j|t)s'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

module.exports = config;
