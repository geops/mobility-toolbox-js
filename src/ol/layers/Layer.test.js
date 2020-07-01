import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Layer from './Layer';

const olLayer = new VectorLayer({ source: new VectorSource() });

describe('Layer', () => {
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

  test('should called terminate on initialization.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    const spy = jest.spyOn(layer, 'terminate');
    layer.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
