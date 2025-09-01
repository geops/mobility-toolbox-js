import { Evented } from 'maplibre-gl';

import Layer from './Layer';

describe('Layer', () => {
  test('should be initialized with good properties and with functions implemented', () => {
    const options = {
      foo: 'bar',
      id: 'Layer',
    };
    const layer = new Layer(options);
    expect(layer).toBeInstanceOf(Evented);
    expect(layer).toBeInstanceOf(Layer);
    expect(layer.id).toBe('Layer');
    expect(layer.options).toEqual(options);
    expect(layer.type).toEqual('custom');
    expect(layer.onAdd).toBeDefined();
    expect(layer.onRemove).toBeDefined();
    expect(layer.render).toBeDefined();
  });

  test('should set map property onAdd', () => {
    const layer = new Layer();
    const map = {};
    layer.onAdd(map);
    expect(layer.map).toBe(map);
  });

  test('should remove map property onRemove', () => {
    const layer = new Layer();
    const map = {};
    layer.onAdd(map);
    layer.onRemove();
    expect(layer.map).toBeUndefined();
  });
});
