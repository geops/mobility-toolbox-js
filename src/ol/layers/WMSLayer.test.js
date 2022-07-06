import OLView from 'ol/View';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import fetch from 'jest-fetch-mock';
import Map from 'ol/Map';
import WMSLayer from './WMSLayer';

describe('WMSLayer', () => {
  let map;
  let layer;
  beforeEach(() => {
    map = new Map({
      view: new OLView({ resolution: 5 }),
      target: document.body,
    });

    layer = new WMSLayer({
      olLayer: new ImageLayer({
        source: new ImageWMS({
          url: 'http://dummy',
          params: { LAYERS: 'layers' },
        }),
      }),
    });
    layer.attachToMap(map);
    fetch.mockResponseOnce(JSON.stringify({ features: [] }));
    global.fetch = fetch;
  });

  afterEach(() => {
    layer.detachFromMap();
  });

  test('should initialize.', () => {
    expect(layer).toBeInstanceOf(WMSLayer);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'detachFromMap');
    layer.attachToMap();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should return a promise resolving features.', async () => {
    const data = await layer.getFeatureInfoAtCoordinate([50, 50]);
    const params = new URL(fetch.mock.calls[0][0]).searchParams;
    expect(params.get('REQUEST')).toBe('GetFeatureInfo');
    expect(params.get('I')).toBe('50');
    expect(params.get('J')).toBe('50');
    expect(data.features).toEqual([]);
  });

  test('should return a layer instance and a coordinate.', async () => {
    const data = await layer.getFeatureInfoAtCoordinate([50, 50]);
    expect(data.coordinate).toEqual([50, 50]);
    expect(data.layer).toBeInstanceOf(WMSLayer);
  });

  test('should clone', () => {
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(WMSLayer);
  });
});
