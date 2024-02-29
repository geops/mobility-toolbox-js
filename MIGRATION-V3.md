# Migration v3

The version contains a lot of breaking changes.

Now we use the native api of OpenLayers and Maplibre to add/remove layers and controls it makes the library more flexible and easier to use.

We also remove the dependency to  `mapbox-gl` and use only `maplibre-gl` instead.

Here is an exhaustive list of what you have to change in your application code.

## exports

- remove the `mapbox-gl` package from dependencies
- module `'mobility-toolbox-js/mapbox'` has been replaced by `'mobility-toolbox-js/maplibre'`
- all `MapboxXXX` classes have been renamed to `MaplibreXXX` classes
- function `getMapboxMapCopyrights()` has been renamed by `getMapGlCopyrights()`

## in mobility-toolbox/ol module

### for all Layer classes

Layes classes inherits now from `ol/layer/Base` directly.
So now native ol function like `setVisible()` are available directly on the layer.

THe `olLayer` property has been removed. Use the layer itself directly instead.

```js
// Before:
layer.olLayer.setVisible(true);

// After
layer.setVisible(true);
```

To add a layer use the `addLayer()` method of the map instead of the `attachToMap()` method of the layer.

```js
// Before:
layer.attachToMap(map);

// After
map.addLayer(layer);
```

### for all Control classes

Controls classes inherits now from `ol/control/Control` directly.
So now native ol functionnalities are available directly on the layer.

To add a control use the `addControl()` method of the map instead of the `attachToMap()` method of the control.

```js
// Before:
control.attachToMap(map);

// After
map.addControl(control);
```

## in mobility-toolbox/maplibre module

### for all Layer classes

Layes classes inherits now from [`Evented`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/) and implements the [`CustomLayerInterface`](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/).

To add a layer use the `addLayer()` method of the map instead of the `attachToMap()` method of the layer.

```js
// Before:
layer.attachToMap(map);

// After
map.addLayer(layer);
```

We also have removed the onClick, onHover properties. Because we never used it.

### for all Control classes

Controls classes impments now the  [`IControl`](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/IControl/) interface directly.
So now native Maplibre functionnalities are available directly on the control.

To add a control use the `addControl()` method of the map instead of the `attachToMap()` method of the control.

```js
// Before:
control.attachToMap(map);

// After
map.addControl(control);
```
