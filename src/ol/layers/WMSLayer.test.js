import OLView from 'ol/View';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import fetch from 'jest-fetch-mock';
import qs from 'query-string';
import Map from '../Map';
import WMSLayer from './WMSLayer';

describe('WMSLayer', () => {
  let map;
  let layer;
  beforeEach(() => {
    map = new Map({ view: new OLView({ resolution: 5 }) });

    layer = new WMSLayer({
      olLayer: new ImageLayer({
        source: new ImageWMS({
          url: 'dummy',
          params: { LAYERS: 'layers' },
        }),
      }),
    });
    map.addLayer(layer);
    fetch.mockResponseOnce(JSON.stringify({ features: [] }));
    global.fetch = fetch;
  });

  test('should initialize.', () => {
    expect(layer).toBeInstanceOf(WMSLayer);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');
    layer.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should return a promise resolving features.', async () => {
    const data = await layer.getFeatureInfoAtCoordinate([50, 50]);
    const params = qs.parse(fetch.mock.calls[0][0].split('?')[1]);
    expect(params.REQUEST).toBe('GetFeatureInfo');
    expect(params.I).toBe('50');
    expect(params.J).toBe('50');
    expect(data.features).toEqual([]);
  });

  test('should return a layer instance and a coordinate.', async () => {
    const data = await layer.getFeatureInfoAtCoordinate([50, 50]);
    expect(data.coordinate).toEqual([50, 50]);
    expect(data.layer).toBeInstanceOf(WMSLayer);
  });

  test('#onClick', () => {
    const f = () => {};
    layer.onClick(f);
    expect(layer.clickCallbacks[0]).toBe(f);
    expect(layer.clickCallbacks.length).toBe(1);
    layer.onClick(f);
    expect(layer.clickCallbacks.length).toBe(2);
  });

  test('should onClick throw error.', () => {
    expect(() => {
      layer.onClick('not of type function');
    }).toThrow(Error);
  });
});
