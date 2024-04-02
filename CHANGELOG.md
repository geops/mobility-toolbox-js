# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.4.0](https://github.com/geops/mobility-toolbox-js/compare/v2.3.11...v2.4.0) (2024-04-02)


### Features

* add a more generic setFeatureState function ([d5d3f96](https://github.com/geops/mobility-toolbox-js/commit/d5d3f962c305e1f945949399b09c7d012b14ad02))


### Bug Fixes

* returns the proper layer value in feature info ([fd72024](https://github.com/geops/mobility-toolbox-js/commit/fd720243d7369596950fb2521e537869b49c8abf))

### [2.3.11](https://github.com/geops/mobility-toolbox-js/compare/v2.3.9...v2.3.11) (2024-04-02)


### Bug Fixes

* remove default highlighting of feature and featureInfoFilter property. Too application specific.

### [2.3.9](https://github.com/geops/mobility-toolbox-js/compare/v2.3.8...v2.3.9) (2024-02-27)


### Bug Fixes

* calculate the correct gen level when we highlight a trajectory ([#208](https://github.com/geops/mobility-toolbox-js/issues/208)) ([3d06bb7](https://github.com/geops/mobility-toolbox-js/commit/3d06bb71846572bdec185d4a66a5b5fd500d55c6))

### [2.3.8](https://github.com/geops/mobility-toolbox-js/compare/v2.3.7...v2.3.8) (2024-01-18)


### Bug Fixes

* debounce calls to setBbox ([#206](https://github.com/geops/mobility-toolbox-js/issues/206)) ([b50feca](https://github.com/geops/mobility-toolbox-js/commit/b50feca53134856409ac79252e244ea97749435f))

### [2.3.7](https://github.com/geops/mobility-toolbox-js/compare/v2.3.6...v2.3.7) (2023-12-06)


### Bug Fixes

* add a getText method in style options ([707d5e7](https://github.com/geops/mobility-toolbox-js/commit/707d5e728c8fe1925d676ae41d3dc0e196588f5d))

### [2.3.6](https://github.com/geops/mobility-toolbox-js/compare/v2.3.5...v2.3.6) (2023-12-06)


### Bug Fixes

* add a getText method in style options ([92b4e93](https://github.com/geops/mobility-toolbox-js/commit/92b4e93597e4909e4aa996822fe01ee0ae9adbe2))

### [2.3.5](https://github.com/geops/mobility-toolbox-js/compare/v2.3.4...v2.3.5) (2023-11-17)


### Bug Fixes

* simplify setBbox function ([8f99991](https://github.com/geops/mobility-toolbox-js/commit/8f99991df3f99c64b3776cd8c18dff0820c4a638))
* use floored value for the zoom ([7961de0](https://github.com/geops/mobility-toolbox-js/commit/7961de0d3e660d67658205aef5e6578ea79b440b))

### [2.3.4](https://github.com/geops/mobility-toolbox-js/compare/v2.3.3...v2.3.4) (2023-11-17)


### Bug Fixes

* do not set generalizationLevelByZoom by default ([69b59ba](https://github.com/geops/mobility-toolbox-js/commit/69b59ba204529eb90cf1bd99a5bedd95705f821f))
* simplify getMotsByZoom behavior ([1fc259f](https://github.com/geops/mobility-toolbox-js/commit/1fc259f29bf3da276a158aa2c063e7609ca6a6f9))
* simplify getMotsByZoom behavior ([87e52ec](https://github.com/geops/mobility-toolbox-js/commit/87e52ec26e9d7204b563a39602fa3c0aa1a90530))

### [2.3.3](https://github.com/geops/mobility-toolbox-js/compare/v2.3.2...v2.3.3) (2023-11-17)


### Bug Fixes

* add text parameter to getXXXFont functions ([83cec9b](https://github.com/geops/mobility-toolbox-js/commit/83cec9b3b9a58aad76a3944257cf83dc80710b89))
* send floor/ceil values to the websocket ([50b8b0a](https://github.com/geops/mobility-toolbox-js/commit/50b8b0aaad28f9cc63ab1c7f460d2662262bcfe6))
* update full trajectory layer when interacting and animating ([97a9ad8](https://github.com/geops/mobility-toolbox-js/commit/97a9ad86d03d4ca8f760df3269840537746cd403))

### [2.3.2](https://github.com/geops/mobility-toolbox-js/compare/v2.3.1...v2.3.2) (2023-11-14)


### Bug Fixes

* add getXXXFont function to realtime style options ([310be23](https://github.com/geops/mobility-toolbox-js/commit/310be2350e96eb815d080f1a00eaafcb8d79e1e6))

### [2.3.1](https://github.com/geops/mobility-toolbox-js/compare/v2.3.0...v2.3.1) (2023-11-03)


### Bug Fixes

* display delay in seconds when needed ([d3284f9](https://github.com/geops/mobility-toolbox-js/commit/d3284f988223fbb2e39542d84d875d75fa400cc7))

## [2.3.0](https://github.com/geops/mobility-toolbox-js/compare/v2.2.1...v2.3.0) (2023-10-26)


### Features

* use realtime api v2 by default ([#194](https://github.com/geops/mobility-toolbox-js/issues/194)) ([fb5e950](https://github.com/geops/mobility-toolbox-js/commit/fb5e9509b17ee383278fe1af7d2e56c76633f3dc))

### [2.2.1](https://github.com/geops/mobility-toolbox-js/compare/v2.2.0...v2.2.1) (2023-10-25)


### Bug Fixes

* add new bboxParamters property ([ee56316](https://github.com/geops/mobility-toolbox-js/commit/ee5631604dbfee009c0e8c5208b5cedb51616796))

## [2.2.0](https://github.com/geops/mobility-toolbox-js/compare/v2.1.1...v2.2.0) (2023-10-13)


### Features

* add new get an gettrajectory method in realtimeapi ([#195](https://github.com/geops/mobility-toolbox-js/issues/195)) ([0461fde](https://github.com/geops/mobility-toolbox-js/commit/0461fdebe8f36e0680eb5d802546ec91306da843))

### [2.1.1](https://github.com/geops/mobility-toolbox-js/compare/v2.1.0...v2.1.1) (2023-10-06)


### Bug Fixes

* add trajectory to the list even if they are filtered out ([f0d034c](https://github.com/geops/mobility-toolbox-js/commit/f0d034c6cd815dde6a27c65ff85330df7720521b))

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
