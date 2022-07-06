import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Layer from './Layer';

const olLayer = new VectorLayer({ source: new VectorSource() });

describe('Layer', () => {
  test('should initialize.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    expect(layer).toBeInstanceOf(Layer);
  });

  test('should define default properties.', () => {
    const options = {
      name: 'Layer',
      key: 'Layerkey',
      olLayer,
    };
    const layer = new Layer(options);

    expect(layer).toBeInstanceOf(Layer);
    expect(layer.options).toEqual(options);
    expect(layer.name).toEqual(options.name);
    expect(layer.key).toEqual('Layerkey');
    expect(layer.hitTolerance).toBe(5);
    expect(layer.copyrights).toEqual([]);
    expect(layer.visible).toBe(true);
    expect(layer.properties).toEqual({});
    expect(layer.map).toBe(undefined);
    expect(layer.group).toBe(undefined);
  });

  test('should be visible by default.', () => {
    const layer = new Layer();
    expect(layer.visible).toBe(true);
  });

  test('should be hidden using constructor.', () => {
    const layer = new Layer({ visible: false });
    expect(layer.visible).toBe(false);
  });

  test('should be hidden using setter.', () => {
    const layer = new Layer();
    layer.visible = false;
    expect(layer.visible).toBe(false);
  });

  test('should visibility stay unchanged', () => {
    const layer = new Layer();
    layer.visible = false;
    expect(layer.visible).toBe(false);
  });

  test('should return its name.', () => {
    const layer = new Layer({ name: 'Layer' });
    expect(layer.name).toEqual('Layer');
  });

  test('should called detachFromMap on initialization.', () => {
    const layer = new Layer();
    const spy = jest.spyOn(layer, 'detachFromMap');
    layer.attachToMap();
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
      children: [new Layer(), new Layer()],
    });
    expect(layer.children.length).toBe(2);
    expect(layer.children[0].parent).toBe(layer);
    expect(layer.children[1].parent).toBe(layer);
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

  describe('#attachToMap()', () => {
    test('should set map.', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });

      expect(layer.map).toBe(undefined);
      const obj = {};
      layer.attachToMap(obj);
      expect(layer.map).toBe(obj);
    });

    test('should call terminate.', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const spy = jest.spyOn(layer, 'detachFromMap');
      layer.attachToMap();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#getFeatureInfoAtCoordinate()', () => {
    test('return an empty fetaureInfo object and display an error message', (done) => {
      // eslint-disable-next-line no-console
      console.error = jest.fn();
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const coord = [0, 0];
      layer.getFeatureInfoAtCoordinate(coord).then((featureInfo) => {
        expect(featureInfo.features).toEqual([]);
        expect(featureInfo.layer).toEqual(layer);
        expect(featureInfo.coordinate).toEqual(coord);
        // eslint-disable-next-line no-console
        expect(console.error).toHaveBeenCalledTimes(1);
        done();
        // eslint-disable-next-line no-console
        console.error.mockRestore();
      });
    });
  });
});
