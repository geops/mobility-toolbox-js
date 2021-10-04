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

  test('should properties correctly set and get.', () => {
    const layer = new Layer({
      name: 'Layer',
      olLayer,
      properties: {
        abc: 'foo',
      },
    });
    expect(layer).toBeInstanceOf(Layer);
    expect(layer.get('abc')).toEqual('foo');

    layer.set('abc', 'bar');
    expect(layer.get('abc')).toEqual('bar');
  });

  test('should set children', () => {
    const layer = new Layer({
      name: 'foo',
      children: [
        new Layer({
          name: 'bar',
        }),
        new Layer({
          name: 'foobar',
          visible: false,
        }),
      ],
    });
    expect(layer.getVisibleChildren().length).toBe(1);
    expect(layer.hasVisibleChildren()).toBe(true);
    expect(layer.hasChildren(false)).toBe(true);

    layer.addChild(
      new Layer({
        name: 'bla',
      }),
    );

    expect(layer.getVisibleChildren().length).toBe(2);

    layer.removeChild('bla');

    expect(layer.getVisibleChildren().length).toBe(1);
  });

  test('should onClick throw error.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    expect(() => {
      layer.onClick('not of type function');
    }).toThrow(Error);
  });

  test('should initialize copyrights property.', () => {
    const layer = new Layer({
      name: 'Layer',
      olLayer,
      copyrights: ['&copy: copyright', 'another copyright'],
    });

    expect(layer.copyrights[0]).toEqual('&copy: copyright');
  });

  test('should set and get copyright property.', () => {
    const layer = new Layer({
      name: 'Layer',
      olLayer,
    });
    expect(layer).toBeInstanceOf(Layer);
    expect(layer.copyright).toEqual(undefined);

    layer.copyright = '&copy; OSM Contributors';
    expect(layer.copyright).toEqual('&copy; OSM Contributors');
  });
});
