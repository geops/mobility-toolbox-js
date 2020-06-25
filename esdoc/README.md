# Esdoc

To generate the api documentation. We use [Esdoc](https://esdoc.org/).

## Build

`yarn apidoc`  : Build only the api documentation in `../apidoc` folder. Use it for development.

## Configuration

See `.esdoc.json` file at the root of the project.

## Template

We use a copy of the original template in `./template`.

Changes are:

- removing the header in layout.html
- moving the search input to the left

## Plugins

We use a custom plugin defined in `./plugins`.

Custom plugins:

- `./plugins/dynamic-property-plugin` : Add new tag `@classpropersty`.

## Coverage

Esdoc generates a coverage page.

Run `yarn  apidoc` .

Then opens `../apidoc/source.html` with your favorite browser.
