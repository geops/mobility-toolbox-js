# Esdoc

To generate the api documentation. We use [Esdoc](https://esdoc.org/).

## Build

`yarn apidoc`  : Build only the api documentation in `../apidoc` folder. Use it for development.

## Configuration

See `.esdoc.json` file at the root of the project.

## Plugins

We use a custom plugin defined in `./plugins`.

To create a plugin have a look to this useful [blog](https://medium.com/trabe/understanding-esdoc-plugins-d9ee9095d98b).

Some [plugins](https://github.com/esdoc/esdoc-plugins) for inspiration.

## Coverage

Esdoc generates a coverage page.

Run `yarn  apidoc` .

Then opens `../apidoc/source.html` with your favorite browser.
