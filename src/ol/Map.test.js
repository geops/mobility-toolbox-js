import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Map from './Map';
import Layer from './layers/Layer';

const olLayer = new VectorLayer({ source: new VectorSource() });

describe('Map', () => {
  let map;

  beforeEach(() => {
    map = new Map({ target: document.body });
  });

  test('should init layer on add.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    const spy = jest.spyOn(layer, 'init');
    map.addLayer(layer);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(map.getLayers().getLength()).toBe(1);
  });

  test('should terminate layer on remove.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    const spy = jest.spyOn(layer, 'terminate');
    map.addLayer(layer);
    expect(map.getLayers().getLength()).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    map.removeLayer(layer);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(layer.visible).toBe(true);
    expect(map.getLayers().getLength()).toBe(1);
  });
});
