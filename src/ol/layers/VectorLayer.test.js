import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Map from 'ol/Map';
import VectorLayer from './VectorLayer';

const feature1 = new Feature({
  attribute: 'bar',
  geometry: new Point([500, 500]),
});
const olLayer = new OLVectorLayer({
  source: new VectorSource({
    features: [
      feature1,
      new Feature({
        attribute: 'foo',
        geometry: new Point([50, 50]),
      }),
    ],
  }),
});

let layer;
let map;
let onClick;

describe('VectorLayer', () => {
  beforeEach(() => {
    onClick = jest.fn();
    layer = new VectorLayer({
      name: 'Layer',
      olLayer,
      onClick,
    });
    map = new Map({
      view: new View({ resolution: 5 }),
      target: document.body,
    });
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(VectorLayer);
    expect(layer.hitTolerance).toBe(5);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'detachFromMap');
    layer.attachToMap();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should call getFeatureInfoAtCoordinate on click then the callback', async () => {
    const coordinate = [500, 500];
    const px = [10, 10];
    const features = [feature1];
    const evt = { type: 'singleclick', map, coordinate };
    const spy = jest.spyOn(layer, 'getFeatureInfoAtCoordinate');
    const spy2 = jest.spyOn(map, 'getPixelFromCoordinate').mockReturnValue(px);
    const spy3 = jest
      .spyOn(map, 'getFeaturesAtPixel')
      .mockReturnValue(features);
    layer.attachToMap(map);
    expect(onClick).toHaveBeenCalledTimes(0);
    await map.dispatchEvent(evt);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(coordinate);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledWith(coordinate);
    expect(spy3).toHaveBeenCalledTimes(1);
    expect(spy3.mock.calls[0][0]).toBe(px);
    expect(spy3.mock.calls[0][1].layerFilter(layer.olLayer)).toBe(true);
    expect(spy3.mock.calls[0][1].layerFilter({})).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toBe(features);
    expect(onClick.mock.calls[0][1]).toBe(layer);
    expect(onClick.mock.calls[0][2]).toBe(coordinate);
  });

  test('should clone', () => {
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(VectorLayer);
  });
});
