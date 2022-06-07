import OlMap from 'ol/Map';
import View from 'ol/View';
import gllib from 'maplibre-gl';
import Layer from './Layer';
import MaplibreLayer from './MaplibreLayer';
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
    source = new MaplibreLayer({
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
    map = new OlMap({
      target: document.createElement('div'),
      view: new View({ center: [0, 0] }),
    });
  });

  afterEach(() => {
    if (layer.map) {
      layer.terminate(map);
    }
    if (source.map) {
      source.terminate(map);
    }
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(MapboxStyleLayer);
    expect(layer.styleLayers[0]).toBe(styleLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should not initalized mapbox map.', () => {
    layer.init();
    expect(layer.mbMap).toBe();
    layer.terminate();
  });

  test('should initalized mapbox map.', () => {
    source.init(map);
    layer.init(map);
    expect(layer.mapboxLayer.mbMap).toBeInstanceOf(gllib.Map);
    layer.terminate();
    source.terminate();
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
    layer.terminate(map);
  });

  test('should return coordinates, features and a layer instance.', async () => {
    source.init(map);
    layer.init(map);
    const data = await layer.getFeatureInfoAtCoordinate([50, 50]);
    expect(data.coordinate).toEqual([50, 50]);
    expect(data.features).toEqual([]);
    expect(data.layer).toBeInstanceOf(MapboxStyleLayer);
    layer.terminate(map);
    source.terminate(map);
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
    layer.terminate();
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

  test('should add layer on load', () => {
    const style = { layers: [] };
    layer.mapboxLayer.mbMap = {
      getStyle: () => style,
      getSource: () => ({}),
      getLayer: () => null,
      setLayoutProperty: () => null,
      addLayer: (styleLayerr) => style.layers.push(styleLayerr),
    };
    layer.onLoad();
    expect(style.layers[0]).toBe(styleLayer);
  });

  describe('should set disabled property to false on load', () => {
    test('when layer uses styleLayer property', () => {
      const styles = { layers: [] };
      layer.mapboxLayer.mbMap = {
        getStyle: () => styles,
        getSource: () => ({}),
        getLayer: () => null,
        setLayoutProperty: () => null,
        addLayer: (styleLayerr) => styles.layers.push(styleLayerr),
      };
      expect(layer).toBeInstanceOf(MapboxStyleLayer);
      layer.onLoad();
      expect(layer.disabled).toBe(false);
    });
  });

  describe('should set disabled property to true on load', () => {
    test('when layer uses styleLayersFilter property', () => {
      const styles = { layers: [styleLayer] };
      const layer2 = new MapboxStyleLayer({
        name: 'mapbox layer',
        mapboxLayer: source,
        styleLayersFilter: () => false,
      });
      layer2.mapboxLayer.mbMap = {
        getStyle: () => styles,
        getSource: () => ({}),
        getLayer: () => null,
        setLayoutProperty: () => null,
        addLayer: () => ({}),
      };
      layer2.onLoad();
      expect(layer2.disabled).toBe(true);
    });
  });

  describe('#getFeatureInfoAtCoordinate()', () => {
    beforeEach(() => {
      source.init(map);
      source.mbMap.isStyleLoaded = jest.fn(() => true);
      source.mbMap.getSource = jest.fn(() => true);
    });
    afterEach(() => {
      source.mbMap.getSource.mockRestore();
      source.mbMap.isStyleLoaded.mockRestore();
    });

    test('should request features on layers ids from styleLayers property', () => {
      source.mbMap.getStyle = jest.fn(() => ({
        layers: [{ id: 'foo' }, { id: 'layer' }, { id: 'bar' }],
      }));
      layer.init(map);
      layer.mapboxLayer.getFeatureInfoAtCoordinate = jest.fn(() =>
        Promise.resolve({ features: [] }),
      );
      layer.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(layer.mapboxLayer.getFeatureInfoAtCoordinate).toHaveBeenCalledWith(
        [0, 0],
        { layers: ['layer'], validate: false },
      );
      layer.mapboxLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mbMap.getStyle.mockRestore();
    });

    test('should request features on layers ids from styleLayersFilter property', () => {
      source.mbMap.getStyle = jest.fn(() => ({
        layers: [{ id: 'foo' }, { id: 'layer' }, { id: 'bar' }, { id: 'foo2' }],
      }));
      const layer2 = new MapboxStyleLayer({
        name: 'mapbox layer',
        visible: true,
        mapboxLayer: source,
        styleLayer,
        styleLayersFilter: ({ id }) => /foo/.test(id),
      });
      layer2.init(map);
      layer2.mapboxLayer.getFeatureInfoAtCoordinate = jest.fn(() =>
        Promise.resolve({ features: [] }),
      );
      layer2.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer2.mapboxLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], {
        layers: ['foo', 'foo2'],
        validate: false,
      });
      layer2.mapboxLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mbMap.getStyle.mockRestore();
    });

    test('should request features on layers ids from queryRenderedLayersFilter property', () => {
      source.mbMap.getStyle = jest.fn(() => ({
        layers: [
          { id: 'foo' },
          { id: 'bar2' },
          { id: 'layer' },
          { id: 'bar' },
          { id: 'foo2' },
        ],
      }));
      const layer2 = new MapboxStyleLayer({
        name: 'mapbox layer',
        visible: true,
        mapboxLayer: source,
        styleLayer,
        styleLayersFilter: ({ id }) => /foo/.test(id),
        queryRenderedLayersFilter: ({ id }) => /bar/.test(id),
      });
      layer2.init(map);
      layer2.mapboxLayer.getFeatureInfoAtCoordinate = jest.fn(() =>
        Promise.resolve({ features: [] }),
      );
      layer2.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer2.mapboxLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], {
        layers: ['bar2', 'bar'],
        validate: false,
      });
      layer2.mapboxLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mbMap.getStyle.mockRestore();
    });
  });
});
