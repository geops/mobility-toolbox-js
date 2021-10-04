import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Map from 'ol/Map';
import Group from 'ol/layer/Group';
import Layer from './Layer';

let olLayer;
let map;

describe('Layer', () => {
  beforeEach(() => {
    map = new Map({});
    olLayer = new VectorLayer({ source: new VectorSource() });
  });

  test('should initialize.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    expect(layer).toBeInstanceOf(Layer);
  });

  test('should be visible by default.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    expect(layer.visible).toBe(true);
  });

  test('should be invisible if defined.', () => {
    const layer = new Layer({ name: 'Layer', visible: false, olLayer });
    expect(layer.visible).toBe(false);
  });

  test('should be invisible if set.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    layer.setVisible(false);
    expect(layer.visible).toBe(false);
  });

  test('should visibility stay unchanged', () => {
    const layer = new Layer({ name: 'Layer', visible: false, olLayer });
    layer.setVisible(false);
    expect(layer.visible).toBe(false);
  });

  test('should return its name.', () => {
    const layer = new Layer({ name: 'Layer', visible: false, olLayer });
    expect(layer.name).toEqual('Layer');
  });

  test('should call terminate on initialization.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    const spy = jest.spyOn(layer, 'terminate');
    layer.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should call terminate when the layer is removed.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    const spy = jest.spyOn(layer, 'terminate');
    layer.init(map);
    map.addLayer(olLayer);
    expect(spy).toHaveBeenCalledTimes(1);
    map.removeLayer(olLayer);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('should manage copyrights as string.', () => {
    const spy = jest.spyOn(VectorSource.prototype, 'setAttributions');
    const layer = new Layer({ name: 'Layer', copyrights: 'foo', olLayer });
    layer.init(map);
    expect(spy).toHaveBeenCalledWith(['foo']);
  });

  test('should manage copyrights as array.', () => {
    const spy = jest.spyOn(VectorSource.prototype, 'setAttributions');
    const layer = new Layer({ name: 'Layer', copyrights: ['bar'], olLayer });
    layer.init(map);
    expect(spy).toHaveBeenCalledWith(['bar']);
  });

  test('should set attributions for Group.', () => {
    const spy = jest.spyOn(VectorSource.prototype, 'setAttributions');
    const layer = new Layer({
      name: 'Layer',
      copyrights: ['bar'],
      olLayer: new Group({ layers: [olLayer] }),
    });
    layer.init(map);
    expect(spy).toHaveBeenCalledWith(['bar']);
  });

  test('should clone', () => {
    const layer = new Layer({
      name: 'Layer',
      copyrights: ['bar'],
      olLayer: new Group({ layers: [olLayer] }),
    });
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(Layer);
  });
});
