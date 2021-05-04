import Map from 'ol/Map';
import View from 'ol/View';
import mapboxgl from 'mapbox-gl';
import Layer from './Layer';
import MapboxLayer from './MapboxLayer';
import MapboxStyleLayer from './MapboxStyleLayer';

let source;
let layer;
let map;
let onClick;

const styleLayer = {
  id: 'layer',
};

describe('MapboxStyleLayer', () => {
  beforeEach(() => {
    onClick = jest.fn();
    source = new MapboxLayer({
      name: 'Layer',
      apiKey: false,
    });
    layer = new MapboxStyleLayer({
      name: 'mapbox layer',
      visible: true,
      mapboxLayer: source,
      styleLayer,
      onClick,
    });
    map = new Map({
      target: document.createElement('div'),
      view: new View({ center: [0, 0] }),
    });
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(MapboxStyleLayer);
    expect(layer.styleLayers[0]).toBe(styleLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should not initalized mapbox map.', () => {
    layer.init();
    expect(layer.mbMap).toBe();
  });

  test('should initalized mapbox map.', () => {
    source.init(map);
    layer.init(map);
    expect(layer.mapboxLayer.mbMap).toBeInstanceOf(mapboxgl.Map);
  });

  test('should add onClick callback.', () => {
    const onClick2 = jest.fn();
    layer.onClick(onClick2);
    expect(layer.clickCallbacks[1]).toBe(onClick2);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');
    layer.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should return coordinates, features and a layer instance.', async () => {
    source.init(map);
    layer.init(map);
    const data = await layer.getFeatureInfoAtCoordinate([50, 50]);
    expect(data.coordinate).toEqual([50, 50]);
    expect(data.features).toEqual([]);
    expect(data.layer).toBeInstanceOf(MapboxStyleLayer);
  });

  test('should call onClick callback', async () => {
    const coordinate = [500, 500];
    const features = [];
    const evt = { type: 'singleclick', map, coordinate };
    layer.init(map);
    expect(onClick).toHaveBeenCalledTimes(0);
    await map.dispatchEvent(evt);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(features, layer, coordinate);
  });

  test('should call super class terminate function.', () => {
    layer.init(map);
    const spy = jest.spyOn(Layer.prototype, 'terminate');
    layer.terminate(map);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('should call super class terminate if the mapboxLayer associated has been terminated before.', () => {
    layer.init(map);
    source.terminate(map);
    const spy = jest.spyOn(Layer.prototype, 'terminate');
    layer.terminate(map);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('should clone', () => {
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(MapboxStyleLayer);
  });
});
