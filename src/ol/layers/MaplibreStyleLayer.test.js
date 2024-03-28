import OlMap from 'ol/Map';
import View from 'ol/View';
import gllib from 'maplibre-gl';
import MaplibreLayer from './MaplibreLayer';
import MaplibreStyleLayer from './MaplibreStyleLayer';

let source;
let layer;
let map;

const layers = [
  {
    id: 'layer',
  },
];

describe('MaplibreStyleLayer', () => {
  beforeEach(() => {
    source = new MaplibreLayer({
      name: 'Layer',
      apiKey: 'foo',
      url: 'https://foo.com/styles',
    });
    layer = new MaplibreStyleLayer({
      name: 'Maplibre layer',
      visible: true,
      maplibreLayer: source,
      layers,
    });
    map = new OlMap({
      target: document.createElement('div'),
      view: new View({ center: [0, 0] }),
    });
  });

  afterEach(() => {
    if (layer.map) {
      layer.detachFromMap(map);
    }
    if (source.map) {
      source.detachFromMap(map);
    }
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(MaplibreStyleLayer);
    expect(layer.layers).toBe(layers);
  });

  test('should initalized Maplibre map.', () => {
    map.addLayer(source);
    map.addLayer(layer);
    expect(layer.maplibreLayer.mbMap).toBeInstanceOf(gllib.Map);
    map.removeLayer(layer);
    map.removeLayer(source);
  });

  test('should clone', () => {
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(MaplibreStyleLayer);
  });

  test('should add layer on load', () => {
    const style = { layers: [] };
    layer.maplibreLayer.mbMap = {
      getStyle: () => style,
      getSource: () => ({}),
      getLayer: () => null,
      setLayoutProperty: () => null,
      addLayer: (styleLayerr) => style.layers.push(styleLayerr),
    };
    layer.onLoad();
    expect(style.layers[0]).toBe(layers[0]);
  });

  describe('should set disabled property to false on load', () => {
    test('when layer uses styleLayer property', () => {
      const styles = { layers: [] };
      layer.maplibreLayer.mbMap = {
        getStyle: () => styles,
        getSource: () => ({}),
        getLayer: () => null,
        setLayoutProperty: () => null,
        addLayer: (styleLayerr) => styles.layers.push(styleLayerr),
      };
      expect(layer).toBeInstanceOf(MaplibreStyleLayer);
      layer.onLoad();
      expect(layer.disabled).toBe(false);
    });
  });

  describe('should set disabled property to true on load', () => {
    test('when layer uses styleLayersFilter property', () => {
      const styles = { layers };
      const layer2 = new MaplibreStyleLayer({
        name: 'Maplibre layer',
        maplibreLayer: source,
        layersFilter: () => false,
      });
      layer2.maplibreLayer.mbMap = {
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

  describe.skip('#getFeatureInfoAtCoordinate()', () => {
    beforeEach(() => {
      source.attachToMap(map);
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
      layer.attachToMap(map);
      layer.maplibreLayer.getFeatureInfoAtCoordinate = jest.fn(() =>
        Promise.resolve({ features: [] }),
      );
      layer.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer.maplibreLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], { layers: ['layer'], validate: false });
      layer.maplibreLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mbMap.getStyle.mockRestore();
    });

    test('should request features on layers ids from styleLayersFilter property', () => {
      source.mbMap.getStyle = jest.fn(() => ({
        layers: [{ id: 'foo' }, { id: 'layer' }, { id: 'bar' }, { id: 'foo2' }],
      }));
      const layer2 = new MaplibreStyleLayer({
        name: 'Maplibre layer',
        visible: true,
        maplibreLayer: source,
        layersFilter: ({ id }) => /foo/.test(id),
      });
      layer2.attachToMap(map);
      layer2.maplibreLayer.getFeatureInfoAtCoordinate = jest.fn(() =>
        Promise.resolve({ features: [] }),
      );
      layer2.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer2.maplibreLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], {
        layers: ['foo', 'foo2'],
        validate: false,
      });
      layer2.maplibreLayer.getFeatureInfoAtCoordinate.mockRestore();
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
      const layer2 = new MaplibreStyleLayer({
        name: 'Maplibre layer',
        visible: true,
        maplibreLayer: source,
        styleLayersFilter: ({ id }) => /foo/.test(id),
        queryRenderedLayersFilter: ({ id }) => /bar/.test(id),
      });
      layer2.attachToMap(map);
      layer2.maplibreLayer.getFeatureInfoAtCoordinate = jest.fn(() =>
        Promise.resolve({ features: [] }),
      );
      layer2.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer2.maplibreLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], {
        layers: ['bar2', 'bar'],
        validate: false,
      });
      layer2.maplibreLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mbMap.getStyle.mockRestore();
    });
  });
});
