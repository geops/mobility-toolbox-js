import gllib from 'maplibre-gl';
import OlMap from 'ol/Map';
import View from 'ol/View';

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

describe.skip('MaplibreStyleLayer', () => {
  beforeEach(() => {
    source = new MaplibreLayer({
      apiKey: 'foo',
      name: 'Layer',
      url: 'https://foo.com/styles',
    });
    layer = new MaplibreStyleLayer({
      layers,
      maplibreLayer: source,
      name: 'Maplibre layer',
      visible: true,
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
    expect(layer.maplibreLayer.mapLibreMap).toBeInstanceOf(gllib.Map);
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
    layer.maplibreLayer.mapLibreMap = {
      addLayer: (styleLayerr) => {
        return style.layers.push(styleLayerr);
      },
      getLayer: () => {
        return null;
      },
      getSource: () => {
        return {};
      },
      getStyle: () => {
        return style;
      },
      setLayoutProperty: () => {
        return null;
      },
      setStyle: () => {},
    };
    layer.onLoad();
    expect(style.layers[0]).toBe(layers[0]);
  });

  describe('should set disabled property to false on load', () => {
    test('when layer uses styleLayer property', () => {
      const styles = { layers: [] };
      layer.maplibreLayer.mapLibreMap = {
        addLayer: (styleLayerr) => {
          return styles.layers.push(styleLayerr);
        },
        getLayer: () => {
          return null;
        },
        getSource: () => {
          return {};
        },
        getStyle: () => {
          return styles;
        },
        setLayoutProperty: () => {
          return null;
        },
        setStyle: () => {},
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
        layersFilter: () => {
          return false;
        },
        maplibreLayer: source,
        name: 'Maplibre layer',
      });
      layer2.maplibreLayer.mapLibreMap = {
        addLayer: () => {
          return {};
        },
        getLayer: () => {
          return null;
        },
        getSource: () => {
          return {};
        },
        getStyle: () => {
          return styles;
        },
        setLayoutProperty: () => {
          return null;
        },
        setStyle: () => {},
      };
      layer2.onLoad();
      expect(layer2.disabled).toBe(true);
    });
  });

  describe.skip('#getFeatureInfoAtCoordinate()', () => {
    beforeEach(() => {
      source.attachToMap(map);
      source.mapLibreMap.isStyleLoaded = jest.fn(() => {
        return true;
      });
      source.mapLibreMap.getSource = jest.fn(() => {
        return true;
      });
    });

    afterEach(() => {
      source.mapLibreMap.getSource.mockRestore();
      source.mapLibreMap.isStyleLoaded.mockRestore();
    });

    test('should request features on layers ids from styleLayers property', () => {
      source.mapLibreMap.getStyle = jest.fn(() => {
        return {
          layers: [{ id: 'foo' }, { id: 'layer' }, { id: 'bar' }],
        };
      });
      layer.attachToMap(map);
      layer.maplibreLayer.getFeatureInfoAtCoordinate = jest.fn(() => {
        return Promise.resolve({ features: [] });
      });
      layer.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer.maplibreLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], { layers: ['layer'], validate: false });
      layer.maplibreLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mapLibreMap.getStyle.mockRestore();
    });

    test('should request features on layers ids from styleLayersFilter property', () => {
      source.mapLibreMap.getStyle = jest.fn(() => {
        return {
          layers: [
            { id: 'foo' },
            { id: 'layer' },
            { id: 'bar' },
            { id: 'foo2' },
          ],
        };
      });
      const layer2 = new MaplibreStyleLayer({
        layersFilter: ({ id }) => {
          return /foo/.test(id);
        },
        maplibreLayer: source,
        name: 'Maplibre layer',
        visible: true,
      });
      layer2.attachToMap(map);
      layer2.maplibreLayer.getFeatureInfoAtCoordinate = jest.fn(() => {
        return Promise.resolve({ features: [] });
      });
      layer2.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer2.maplibreLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], {
        layers: ['foo', 'foo2'],
        validate: false,
      });
      layer2.maplibreLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mapLibreMap.getStyle.mockRestore();
    });

    test('should request features on layers ids from queryRenderedLayersFilter property', () => {
      source.mapLibreMap.getStyle = jest.fn(() => {
        return {
          layers: [
            { id: 'foo' },
            { id: 'bar2' },
            { id: 'layer' },
            { id: 'bar' },
            { id: 'foo2' },
          ],
        };
      });
      const layer2 = new MaplibreStyleLayer({
        maplibreLayer: source,
        name: 'Maplibre layer',
        queryRenderedLayersFilter: ({ id }) => {
          return /bar/.test(id);
        },
        styleLayersFilter: ({ id }) => {
          return /foo/.test(id);
        },
        visible: true,
      });
      layer2.attachToMap(map);
      layer2.maplibreLayer.getFeatureInfoAtCoordinate = jest.fn(() => {
        return Promise.resolve({ features: [] });
      });
      layer2.getFeatureInfoAtCoordinate([0, 0]).then(() => {});
      expect(
        layer2.maplibreLayer.getFeatureInfoAtCoordinate,
      ).toHaveBeenCalledWith([0, 0], {
        layers: ['bar2', 'bar'],
        validate: false,
      });
      layer2.maplibreLayer.getFeatureInfoAtCoordinate.mockRestore();
      source.mapLibreMap.getStyle.mockRestore();
    });
  });
});
