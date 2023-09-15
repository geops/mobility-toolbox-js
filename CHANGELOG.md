# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.1.0](https://github.com/geops/mobility-toolbox-js/compare/v2.0.0-beta.81...v2.1.0) (2023-09-15)


### Bug Fixes

* don't test intersection with the bbox if the update of bbox is not activated ([8ec74ba](https://github.com/geops/mobility-toolbox-js/commit/8ec74ba00c26fe61b301bf2b87549e14cbfa86f8))
* **MapboxStyleLayer:** add minZoom and maxZoom options for layer visibility ([#192](https://github.com/geops/mobility-toolbox-js/issues/192)) ([911db7d](https://github.com/geops/mobility-toolbox-js/commit/911db7d8b481bf5b5c5e6dea676c55874e7cd5f3))

## [2.1.0](https://github.com/geops/mobility-toolbox-js/compare/v1.7.5...v2.1.0) (2022-06-20)

This version contains lot of breaking change, to make things simpler to use and to remove all application specific stuff.
We suggest to have a look at the [v2 migration guide](./MIGRATION-V2.md).

### Breaking changes

* all classes, api and utilities functions are available through a unique import (depending on which mapping library you use): `'mobility-toolbox-js/ol'` or `'mobility-toolbox-js/mapbox'`
  
* rename `TralisAPI` to `RealtimeAPI`
* rename `TralisModes` to `RealtimeModes`
* rename `TralisLayer` to `RealtimeLayer`
* remove `TrajservLayer` class
  
* remove `Map` classes. Use new `attachToMap()` and `detachFromMap()` function to add your layers/controls to a map
* remove all application specific properties from layers classes.`isQueryable`, `isBaseLayer`, `isAlwaysExpanded`, `isReactSpatialLayer`, `isTrackerLayer`, use `options.properties` in the constructor instead
  
* replace `MapboxLayer.createStyleUrl()` by an utility function `getUrlWithParams`
  
* pass `Mapboxgl.Map` options through a `mapOptions` object in the constructor instead of layers\'s property
* pass `RealtimeLayer` style properties through a `styleOptions` object in the constructor instead of layers\'s properties
* pass `RealtimeLayer` filters through the  `filter` property instead of specific layers\'s properties
* harmonize backend responses

### Features

* use TypeScript
* use Maplibre
* use NextJS for website in `doc/` folder
* all classes, api and functions are available through a unique import (depending on what mapping library you use): `'mobility-toolbox-js/ol'` or `'mobility-toolbox-js/mapbox'`
* add a full single-file build for an easy use in raw html page or [codepen.io](https://codepen.io)
* use standard-version for automatic versioning and changelog ([#167](https://github.com/geops/mobility-toolbox-js/issues/167)) ([045ad0b](https://github.com/geops/mobility-toolbox-js/commit/045ad0b533aaa56d84b90178de8e6aa18c2cbd89))
