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

  test('should remove the layer when we call terminate.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    const spy = jest.spyOn(layer, 'terminate');
    layer.init(map);
    expect(spy).toHaveBeenCalledTimes(1);
    layer.terminate(map);
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

  test('should listen for click/hover events when layer is visible by default then should not when hidden.', async () => {
    global.console.error = jest.fn();
    const layer = new Layer({ name: 'Layer', olLayer });
    expect(layer.visible).toBe(true);
    const spy = jest.fn();
    const spy2 = jest.fn();
    layer.init(map);
    layer.onHover(spy);
    layer.onClick(spy2);
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);

    await map.dispatchEvent({ type: 'pointermove', map, coordinate: [0, 0] });
    await map.dispatchEvent({ type: 'singleclick', map, coordinate: [0, 0] });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy2.mockReset();

    layer.setVisible(false);
    await map.dispatchEvent({ type: 'pointermove', map, coordinate: [0, 0] });
    await map.dispatchEvent({ type: 'singleclick', map, coordinate: [0, 0] });
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    global.console.error.mockRestore();
  });

  test('should not listen for click/hover events when layer is not visible by default then should not when visible.', async () => {
    global.console.error = jest.fn();
    const layer = new Layer({ name: 'Layer', olLayer, visible: false });
    expect(layer.visible).toBe(false);
    const spy = jest.fn();
    const spy2 = jest.fn();
    layer.init(map);
    layer.onHover(spy);
    layer.onClick(spy2);
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);

    await map.dispatchEvent({ type: 'pointermove', map, coordinate: [0, 0] });
    await map.dispatchEvent({ type: 'singleclick', map, coordinate: [0, 0] });
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    spy.mockReset();
    spy2.mockReset();

    layer.setVisible(true);
    await map.dispatchEvent({ type: 'pointermove', map, coordinate: [0, 0] });
    await map.dispatchEvent({ type: 'singleclick', map, coordinate: [0, 0] });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    global.console.error.mockRestore();
  });

  test('should not listen for click/hover events  after layer.terminate()', async () => {
    global.console.error = jest.fn();
    const layer = new Layer({ name: 'Layer', olLayer, visible: true });
    expect(layer.visible).toBe(true);
    const spy = jest.fn();
    const spy2 = jest.fn();
    layer.init(map);
    layer.onHover(spy);
    layer.onClick(spy2);
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);

    await map.dispatchEvent({
      type: 'pointermove',
      map,
      coordinate: [0, 0],
    });
    await map.dispatchEvent({
      type: 'singleclick',
      map,
      coordinate: [0, 0],
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy2.mockReset();

    layer.terminate(map);
    await map.dispatchEvent({
      type: 'pointermove',
      map,
      coordinate: [0, 0],
    });
    await map.dispatchEvent({
      type: 'singleclick',
      map,
      coordinate: [0, 0],
    });
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    global.console.error.mockRestore();
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
