# react-esdoc

This folder contains an implementation of the rendering of [esdoc-publish-html-plugin](https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin).

Every components in this folder is an implementation of a `_buildXXX` function in [Builder folder of the plugin](https://github.com/esdoc/esdoc-plugins/tree/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder)
In the documentation of the component you can find the link to the function it implements.

The original css from [esdoc-publish-html-plugin](https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin) is used. See `./css` folder.

## How does it work

The [esdoc-publish-html-plugin](https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin) creates an `index.json` in `apidoc/index.json` when we run `yarn apidoc`.

The `yarn apidoc` task copy automatically this `index.json` in this folder.

This json is loaded in `./DocBuilderUtils.js` then a in memory [taffy](http://taffydb.com/) database is loaded with its content.
This database is only used to facilitate the retrievment of data from the `ìndex.json` content.

## Components

Only 4 components must be used directly:

- Esdoc : The documentation layout.
- EsdocContent : The class/type/function documentation display.
- EsdocNavigation: The documentation navigation tool.
- EsdocSearch: The documentation search box.

## TODO

List of functionalities not implemented because we don't use it :

- Tests
- Decorators
- TODO

## Improvments

- Pass the index.json content as a parameter.
- Configure the replacement of '.' by '%20' in url to make it work with react-router.
- Configure the base url, currently /doc/ is append to all links except source links.
- Configure the github url, currently github.com/mobility-toolbox-js/... is append to all sources links.
- Create an esdoc plugin to generate only the index.json file, it should be easy using [esdoc-publish-html-plugin](https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin) code.
- Convert css to scss.
- Reactivate all eslint rules.
- Reactivate all stylelint rules.
