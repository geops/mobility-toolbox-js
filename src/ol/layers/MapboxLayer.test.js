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
});
