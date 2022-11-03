# Migration v2

The version contains a lot of breaking changes, to make things simpler to use and to remove all application specific stuff.

Here is an exhaustive list of what you have to change in your application code.

## exports

* all classes, api and utilities functions are available through a unique import (depending on what mapping library you use): `'mobility-toolbox-js/ol'` or `'mobility-toolbox-js/mapbox'`

## in Map classes

* remove all `Map` classes. Use the Mapbox or Openlayers Map directly then use `attachToMap()` and `detachFromMap()` functions.
  
```js
  // Before:
  const map = new Map();
  map.addLayer(myLayer);
  map.addControl(myControl);
  map.removeLayer(myLayer);
  map.removeControl(myControl);

  // After
  const map = new Openlayers.Map();
  myLayer.attachToMap(map);
  myControl.attachToMap(map);
  myLayer.detachFromMap();
  myControl.detachFromMap();
```

## in all Layer classes

* add `group` property.
  
```js
  // Before:
  const layer = new layer({ properties: { radioGroup: 'my group' }});

  // After
  const layer = new layer({ group: 'my group' });
```

* remove `TrajservLayer`, use `RealtimeLayer` instead

* remove `addChild()`,`removeChild()`, `hasVisibleChildren()`, `getVisibleChildren()` convenience methods, use `children` array directly instead
* remove `setVisible()` method, use layer\'s property instead
  
```js
  // Before:
  layer.setVisible(true);

  // After
  layer.visible = true;
```

* remove `isBaseLayer` property
  
```js
  // Before:
  const layer = new Layer({ isBaseLayer: true});
  const isBaseLayer = layer.isBaseLayer;

  // After
  const layer = new Layer({ properties: { isBaseLayer: true }});
  const isBaseLayer = layer.get('isBaseLayer');
```

* remove `isQueryable` property
  
```js
  // Before:
  const layer = new Layer({ isQueryable: true});
  const isQueryable = layer.isQueryable;

  // After
  const layer = new Layer({ properties: { isQueryable: true }});
  const isQueryable = layer.get('isQueryable');
```

* remove `isAlwaysExpanded` property
  
```js
  // Before:
  const layer = new Layer({ isAlwaysExpanded: true});
  const isAlwaysExpanded = layer.isAlwaysExpanded;

  // After
  const layer = new Layer({ properties: { isAlwaysExpanded: true }});
  const isAlwaysExpanded = layer.get('isAlwaysExpanded');
```

* remove `isReactSpatialLayer` property
  
* replace `init()` by `attachToMap()`
  
```js
  // Before:
  layer.init(map)

  // After
  layer.attachToMap(map)
```

* replace `terminate()` by `detachFromMap()`
  
```js
  // Before:
  layer.terminate()

  // After
  layer.detachFromMap()
```

## in MapboxLayer and MaplibreLayer classes

* remove `options.preserveDrawingBuffer`, use `options.mapOptions` in the constructor
  
```js
  // Before:
  const layer = new MapoxLayer({ preserveDrawingBuffer: true});

  // After
  const layer = new Layer({ mapOptions: { preserveDrawingBuffer: true}});
```

* replace `createStyleUrl()` by an utility function `getUrlWithParams()`
  
```js
  // Before:
  const layer = new MapoxLayer();
  const url  = layer.createStyleUrl();

  // After
  import {  getUrlWithParams } from 'mobility-toolbox-js/common';
  const layer = new MapoxLayer();
  const url = getUrlWithParams(layer.url, { [layer.apiKeyName]: layer.apiKey }).toString();
```

## in TralisLayer classes

* rename `TralisLayer` to `RealtimeLayer`
* remove `isTrackerLayer` property
* remove properties : `publishedLineName`, `tripNumber`, `operator`, `regexPublishedLineName`. Use utility function `createRealtimeFilters()` instead.
  
```js
  // Before:
  const layer = new TralisLayer({
    publishedLineName: 'foo',
    tripNumber: 2,
    operator: 'bar',
    regexPublishedLineName: /.*/,
  });

  // After
  import {  createRealtimeFilters } from 'mobility-toolbox-js/common';
  
  const layer = new RealtimeLayer({
    filter: createRealtimeFilters('foo','2','bar', /.*/),
  });
```

* remove all automatic filter through permalink using `publishedlinename`, `tripnumber`, `operator`

```js
  // After
  import {  createRealtimeFilters } from 'mobility-toolbox-js/common';
  const params = new URLSearchParans(window.location.search);
  const layer = new RealtimeLayer({
    filter: createRealtimeFilters(
      params.get('publishedlinename'),
      params.get('tripnumber'),
      params.get('operator'),
    ),
  });
```

* remove style properties `delayOutlineColor`, `delayDisplay`, `iconScale`. Use `options.styleOptions` in the constructor to proivde these valeu to the rendering.
  
```js
  // Before
  const layer = new RealtimeLayer({
    delayOutlineColor:'#000',
    delayDisplay: 300000,
    iconScale: 0.5,
  });

  // After
  const layer = new RealtimeLayer({
    styleOptions: {
      delayOutlineColor:'#000',
      delayDisplay: 300000,
      iconScale: 0.5,
    }
  });
```

* remove `getVehiclesAtCoordinate()`, use `getFeatureAtCoordinate()`instead

* remove `useDelayStyle` property, use `style`, `sort` and `fullTrajectoryStyle` instead
  
```js
  // Before
  import { TralisLayer } from 'mobility-toolbox-js/ol';
  const layer = new TralisLayer({
    useDelayStyle: true,
  });

  // After
  import {
    RealtimeLayer,
    fullTrajectoryDelayStyle,
    realtimeDelayStyle,
    sortByDelay,
  } from 'mobility-toolbox-js/ol';
  const layer = new RealtimeLayer({
    style: realtimeDelayStyle,
    sort: sortByDelay,
    fullTrajectoryStyle: fullTrajectoryDelayStyle,
  });
```

## in api classes

* rename `TralisAPI` to `RealtimeAPI`
* rename `TralisModes` to `RealtimeModes`
  
## in StopsAPI class

* `search()` method returns a GeoJSON feature collection instead of an array of GeoJSON feature

```js
  // Before
  const api = new StopsAPI({ ... });
  api.search().then((arrayOfFeatures) => {
    const feature = arrayOfFeatures[0];
  });

  // After
  const api = new StopsAPI({ ... });
  api.search().then((featureCollection) => {
    const feature = featureCollection.features[0];
  });
```

## in RealtimeAPI class

* `subscribeXXX()` methods have all the same signature and returns now the complete websocket message. Check the [doc](https://mobility-toolbox-js.geops.io/doc/class/build/api/RealtimeAPI%20js~RealtimeAPI) for more informations.
* some `getXXX()` methods have a different signature. Check the [doc](https://mobility-toolbox-js.geops.io/doc/class/build/api/RealtimeAPI%20js~RealtimeAPI) for more informations.
