module.exports = {
  source: './build',
  destination: './apidoc',
  includes: ['\\.(js)$', 'typedefs\\.js$'],
  excludes: ['setupTests\\.*', '^iife', '^mbt\\.*', '\\.test\\.js$', 'doc/'],
  plugins: [
    {
      name: './esdoc/plugins/default-accessor-private-plugin/Plugin.js',
    },
    {
      name: 'esdoc-standard-plugin',
    },
    { name: 'esdoc-ecmascript-proposal-plugin', option: { all: true } },
    {
      name: 'esdoc-publish-html-plugin',
    },
    { name: './esdoc/plugins/dynamic-property-plugin/Plugin.js' },
    {
      name: './esdoc/plugins/externals-plugin/Plugin.js',
    },
    { name: './esdoc/plugins/optional-chaining-plugin/Plugin.js' },
    // { name: 'esdoc-typescript-plugin', option: { enable: true } },
  ],
};
