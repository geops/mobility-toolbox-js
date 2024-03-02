import OLView from 'ol/View';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import fetch from 'jest-fetch-mock';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import getFeatureInfoAtCoordinate from './getFeatureInfoAtCoordinate';

describe('getFeatureInfoAtCoordinate', () => {
  let map;

  beforeEach(() => {
    map = new Map({
      view: new OLView({ resolution: 5 }),
      target: document.createElement('div'),
    });
    map.setSize([100, 100]);
    map.getView().setCenter([50, 50]);
    map.getView().setCenter(10);
    document.body.appendChild(map.getTargetElement());
  });

  afterEach(() => {
    document.body.removeChild(map.getTargetElement());
    map.setTarget(null);
  });

  describe('using a WMSLayer', () => {
    let layer;

    beforeEach(() => {
      layer = new ImageLayer({
        source: new ImageWMS({
          url: 'http://dummy',
          params: { LAYERS: 'layers' },
        }),
      });
      map.addLayer(layer);
      fetch.mockResponseOnce(
        JSON.stringify({
          type: 'FeatureCollection',
          features: [],
        }),
      );
      global.fetch = fetch;
    });

    afterEach(() => {
      map.removeLayer(layer);
    });

    test('should return features info', async () => {
      const data = await getFeatureInfoAtCoordinate([50, 50], [layer], map);
      const params = new URL(fetch.mock.calls[0][0]).searchParams;
      expect(params.get('I')).toBe('50');
      expect(params.get('LAYERS')).toBe('layers');
      expect(params.get('I')).toBe('50');
      expect(params.get('J')).toBe('50');
      expect(data.length).toEqual(1);
      expect(data[0].features).toEqual([]);
      expect(data[0].layer).toEqual(layer);
      expect(data[0].coordinate).toEqual([50, 50]);
    });
  });

  describe('using a vector layer', () => {
    let layer;
    const feature = new Feature(new Point([50, 50]));

    beforeEach(() => {
      layer = new VectorLayer({
        source: new Vector({
          features: [feature],
        }),
      });
      map.addLayer(layer);
    });

    afterEach(() => {
      map.removeLayer(layer);
    });

    test('should return features info', async () => {
      map.getFeaturesAtPixel = jest.fn(() => [feature]);
      map.getPixelFromCoordinate = jest.fn(() => [50, 50]);

      const data = await getFeatureInfoAtCoordinate([50, 50], [layer]);

      expect(data.length).toEqual(1);
      expect(data[0].features[0]).toEqual(feature);
      expect(data[0].layer).toEqual(layer);
      expect(data[0].coordinate).toEqual([50, 50]);
    });
  });
});
