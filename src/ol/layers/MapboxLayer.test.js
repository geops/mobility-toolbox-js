import Map from 'ol/Map';
import View from 'ol/View';
import mapboxgl from 'mapbox-gl';
import MapboxLayer from './MapboxLayer';

let layer;
let map;
let consoleOutput;
const styleUrl = 'foo.com/styles';

describe('MapboxLayer', () => {
  describe('without apiKey', () => {
    beforeEach(() => {
      // Mock console statement
      consoleOutput = [];
      // eslint-disable-next-line no-console
      console.warn = (message) => consoleOutput.push(message);
      layer = new MapboxLayer({
        name: 'Layer',
        url: styleUrl,
      });
      map = new Map({
        target: document.createElement('div'),
        view: new View({ center: [0, 0] }),
      });
    });

    test('should be instanced.', () => {
      expect(layer).toBeInstanceOf(MapboxLayer);
      expect(layer.styleUrl).toBe(styleUrl);
    });

    test('should not initalized mapbox map.', () => {
      layer.init();
      expect(layer.mbMap).toBe();
    });

    test('should initalized mapbox map and warn the user if there is no api key defined.', () => {
      layer.init(map);
      expect(layer.mbMap).toBeInstanceOf(mapboxgl.Map);
      expect(consoleOutput[0]).toBe(
        'No apiKey is defined for request to foo.com/styles',
      );
    });

    test('should called terminate on initalization.', () => {
      const spy = jest.spyOn(layer, 'terminate');
      layer.init();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should clone', () => {
      const clone = layer.clone({ name: 'clone' });
      expect(clone).not.toBe(layer);
      expect(clone.name).toBe('clone');
      expect(clone).toBeInstanceOf(MapboxLayer);
    });
  });

  describe('with apiKey', () => {
    beforeEach(() => {
      layer = new MapboxLayer({
        name: 'Layer',
        url: styleUrl,
        apiKey: 'apiKey',
      });
      map = new Map({
        target: document.createElement('div'),
        view: new View({ center: [0, 0] }),
      });
    });

    test('should be instanced with apiKey.', () => {
      expect(layer).toBeInstanceOf(MapboxLayer);
      expect(layer.styleUrl).toBe(styleUrl);
    });

    test('should not initalized mapbox map.', () => {
      layer.init();
      expect(layer.mbMap).toBe();
    });

    test("should initalized mapbox map, with 'apiKey' prop", () => {
      const layer1 = new MapboxLayer({
        name: 'Layer',
        url: styleUrl,
        apiKey: 'apiKeyVal',
      });
      layer1.init(map);
      expect(layer1.mbMap.options.style).toBe('foo.com/styles?key=apiKeyVal');
    });

    test("should initalized mapbox map, with 'apiKeyName' prop", () => {
      const layer1 = new MapboxLayer({
        name: 'Layer',
        url: styleUrl,
        apiKey: 'test',
        apiKeyName: 'apiKey',
      });
      layer1.init(map);
      expect(layer1.mbMap.options.style).toBe('foo.com/styles?apiKey=test');
    });
  });

  describe('#getFeatureInfoAtCoordinate()', () => {
    let layer1;
    beforeEach(() => {
      layer1 = new MapboxLayer({
        name: 'Layer',
        url: styleUrl,
        apiKey: 'test',
        apiKeyName: 'apiKey',
      });
      layer1.init(map);
      layer1.mbMap.isStyleLoaded = jest.fn(() => true);
      layer1.mbMap.getSource = jest.fn(() => true);
    });

    afterEach(() => {
      layer1.mbMap.getSource.mockRestore();
      layer1.mbMap.isStyleLoaded.mockRestore();
    });

    test('should set the mapboxFeature as a property', (done) => {
      const mapboxFeature = {
        id: '2',
        type: 'Feature',
        properties: {
          foo: 'bar',
        },
        source: 'barr',
        sourceLayer: 'fooo',
      };
      layer1.mbMap.project = jest.fn((coord) => ({ x: coord[0], y: coord[1] }));
      layer1.mbMap.queryRenderedFeatures = jest.fn(() => [mapboxFeature]);
      layer1.getFeatureInfoAtCoordinate([0, 0], {}).then((featureInfo) => {
        expect(featureInfo.features[0].get('mapboxFeature')).toBe(
          mapboxFeature,
        );
        done();
      });
      layer1.mbMap.project.mockRestore();
      layer1.mbMap.queryRenderedFeatures.mockRestore();
    });
    describe('should use hitTolerance property', () => {
      beforeEach(() => {
        layer1.mbMap.project = jest.fn((coord) => ({
          x: coord[0],
          y: coord[1],
        }));
      });

      afterEach(() => {
        layer1.mbMap.project.mockRestore();
        layer1.mbMap.queryRenderedFeatures.mockRestore();
      });

      test('when hitTolerance is not set', (done) => {
        layer1.mbMap.queryRenderedFeatures = jest.fn((pixelBounds) => {
          // Use default hoitTolerance
          expect(pixelBounds).toEqual([
            { x: -5, y: -5 },
            { x: 5, y: 5 },
          ]);
          done();
          return [];
        });
        layer1.getFeatureInfoAtCoordinate([0, 0], {});
      });

      test('when hitTolerance is set to 10', (done) => {
        layer1.hitTolerance = 10;
        layer1.mbMap.queryRenderedFeatures = jest.fn((pixelBounds) => {
          // Use default hoitTolerance
          expect(pixelBounds).toEqual([
            { x: -10, y: -10 },
            { x: 10, y: 10 },
          ]);
          done();
          return [];
        });
        layer1.getFeatureInfoAtCoordinate([0, 0], {});
      });
    });
  });
});
