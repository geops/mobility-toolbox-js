import Map from 'ol/Map';
import View from 'ol/View';
import mapboxgl from 'mapbox-gl';
import MapboxLayer from './MapboxLayer';

let layer;
let map;
const styleUrl = 'foo.com/styles';

describe('MapboxLayer', () => {
  describe('without apiKey', () => {
    beforeEach(() => {
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

    test('should initalized mapbox map.', () => {
      layer.init(map);
      expect(layer.mbMap).toBeInstanceOf(mapboxgl.Map);
    });

    test('should called terminate on initalization.', () => {
      const spy = jest.spyOn(layer, 'terminate');
      layer.init();
      expect(spy).toHaveBeenCalledTimes(1);
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
