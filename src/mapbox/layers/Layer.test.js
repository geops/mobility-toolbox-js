import { Map } from 'maplibre-gl';
import { toLonLat } from 'ol/proj';
import Layer from './Layer';

let map;
let mapElement;

describe('Layer', () => {
  beforeEach(() => {
    mapElement = document.createElement('div');
    const { style } = mapElement;
    style.position = 'absolute';
    style.left = '0px';
    style.top = '0px';
    style.width = '400px';
    style.height = '400px';
    mapElement.setAttribute('id', 'map');
    document.body.appendChild(mapElement);
    map = new Map({
      container: document.getElementById('map'),
      style: `path/to/style`,
      center: toLonLat([831634, 5933959]),
      zoom: 9,
    });
  });

  afterEach(() => {
    document.body.removeChild(mapElement);
  });

  test('should initialize.', () => {
    const layer = new Layer({ name: 'Layer' });
    expect(layer).toBeInstanceOf(Layer);
  });

  test('should be visible by default.', () => {
    const layer = new Layer({ name: 'Layer' });
    expect(layer.visible).toBe(true);
  });

  test('should be invisible if defined.', () => {
    const layer = new Layer({ name: 'Layer', visible: false });
    expect(layer.visible).toBe(false);
  });

  test('should be invisible if set.', () => {
    const layer = new Layer({ name: 'Layer' });
    layer.visible = false;
    expect(layer.visible).toBe(false);
  });

  test('should visibility stay unchanged', () => {
    const layer = new Layer({ name: 'Layer', visible: false });
    layer.visible = false;
    expect(layer.visible).toBe(false);
  });

  test('should return its name.', () => {
    const layer = new Layer({ name: 'Layer', visible: false });
    expect(layer.name).toEqual('Layer');
  });

  test('should call terminate on initialization.', () => {
    const layer = new Layer({ name: 'Layer' });
    const spy = jest.spyOn(layer, 'detachFromMap');
    layer.attachToMap(map);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should listen for click/hover events when layer is visible by default then should not when hidden.', async () => {
    global.console.error = jest.fn();
    const layer = new Layer({ name: 'Layer' });
    expect(layer.visible).toBe(true);
    const spy = jest.fn();
    const spy2 = jest.fn();
    layer.onHover(spy);
    layer.onClick(spy2);
    layer.attachToMap(map);
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);

    await map.fire('mousemove', {
      type: 'mousemove',
      lngLat: { toArray: () => [0, 0] },
      coordinate: [0, 0],
    });
    await map.fire('click', {
      type: 'click',
      lngLat: { toArray: () => [0, 0] },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy2.mockReset();

    layer.visible = false;
    await map.fire('mousemove', {
      type: 'mousemove',
      lngLat: { toArray: () => [0, 0] },
    });
    await map.fire('click', {
      type: 'click',
      lngLat: { toArray: () => [0, 0] },
    });
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    global.console.error.mockRestore();
  });

  test('should not listen for click/hover events when layer is not visible by default then should not when visible.', async () => {
    global.console.error = jest.fn();
    const layer = new Layer({ name: 'Layer', visible: false });
    expect(layer.visible).toBe(false);
    const spy = jest.fn();
    const spy2 = jest.fn();
    layer.onHover(spy);
    layer.onClick(spy2);
    layer.attachToMap(map);
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);

    await map.fire('mousemove', {
      type: 'mousemove',
      lngLat: { toArray: () => [0, 0] },
      coordinate: [0, 0],
    });
    await map.fire('click', {
      type: 'click',
      lngLat: { toArray: () => [0, 0] },
    });
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    spy.mockReset();
    spy2.mockReset();

    layer.visible = true;
    await map.fire('mousemove', {
      type: 'mousemove',
      lngLat: { toArray: () => [0, 0] },
      coordinate: [0, 0],
    });
    await map.fire('click', {
      type: 'click',
      lngLat: { toArray: () => [0, 0] },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    global.console.error.mockRestore();
  });

  test('should not listen for click/hover events  after layer.detachFromMap()', async () => {
    global.console.error = jest.fn();
    const layer = new Layer({ name: 'Layer', visible: true });
    expect(layer.visible).toBe(true);
    const spy = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const spy4 = jest.fn();
    layer.onHover(spy);
    layer.onClick(spy2);
    layer.attachToMap(map);

    // Test event after attached to map
    layer.onHover(spy3);
    layer.onClick(spy4);

    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    expect(spy3).toHaveBeenCalledTimes(0);
    expect(spy4).toHaveBeenCalledTimes(0);

    await map.fire('mousemove', {
      type: 'mousemove',
      lngLat: { toArray: () => [0, 0] },
      coordinate: [0, 0],
    });
    await map.fire('click', {
      type: 'click',
      lngLat: { toArray: () => [0, 0] },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);
    expect(spy4).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy2.mockReset();
    spy3.mockReset();
    spy4.mockReset();

    layer.detachFromMap();
    await map.fire('mousemove', {
      type: 'mousemove',
      lngLat: { toArray: () => [0, 0] },
      coordinate: [0, 0],
    });
    await map.fire('click', {
      type: 'click',
      lngLat: { toArray: () => [0, 0] },
    });
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    expect(spy3).toHaveBeenCalledTimes(0);
    expect(spy4).toHaveBeenCalledTimes(0);
    global.console.error.mockRestore();
  });

  test('should clone', () => {
    const layer = new Layer({
      name: 'Layer',
      copyrights: ['bar'],
    });
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(Layer);
  });
});
