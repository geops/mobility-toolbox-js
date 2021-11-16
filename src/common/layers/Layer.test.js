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
      olLayer,
    };
    const layer = new Layer(options);

    expect(layer).toBeInstanceOf(Layer);
    expect(layer.options).toEqual(options);
    expect(layer.name).toEqual(options.name);
    expect(layer.key).toEqual('layer');
    expect(layer.isBaseLayer).toBe(false);
    expect(layer.isBaseLayer).toBe(false);
    expect(layer.isQueryable).toBe(true);
    expect(layer.isClickActive).toBe(true);
    expect(layer.isHoverActive).toBe(true);
    expect(layer.hitTolerance).toBe(5);
    expect(layer.isReactSpatialLayer).toBe(true);
    expect(layer.copyrights).toEqual([]);
    expect(layer.visible).toBe(true);
    expect(layer.properties).toEqual({ copyrights: [] });
    expect(layer.map).toBe(undefined);
    expect(layer.clickCallbacks).toEqual([]);
    expect(layer.hoverCallbacks).toEqual([]);
  });

  test('should be visible by default.', () => {
    const layer = new Layer({ name: 'Layer', olLayer });
    expect(layer.visible).toBe(true);
  });

  test('should be hidden using constructor.', () => {
    const layer = new Layer({ name: 'Layer', visible: false, olLayer });
    expect(layer.visible).toBe(false);
  });

  test('should be hidden using setter.', () => {
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

  describe('#init()', () => {
    test('should set map.', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });

      expect(layer.map).toBe(undefined);
      const obj = {};
      layer.init(obj);
      expect(layer.map).toBe(obj);
    });

    test('should call terminate.', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const spy = jest.spyOn(layer, 'terminate');
      layer.init();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#get() and #set()', () => {
    test('should get/set a properties.', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      expect(layer.get('foo')).toBe(undefined);
      layer.set('foo', 'bar');
      expect(layer.get('foo')).toBe('bar');
    });
  });

  describe('#set()', () => {
    test('should dispatch a change event.', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const spy = jest.spyOn(layer, 'dispatchEvent');
      layer.set('foo', 'bar');
      expect(spy).toHaveBeenCalledWith({ type: 'change:foo', target: layer });
    });
  });

  describe('#setVisible()', () => {
    test("should not trigger a change event if the visiblity hasn't changed.", () => {
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
      });
      const spy = jest.spyOn(layer, 'dispatchEvent');
      layer.setVisible(false, 'foo', 'bar', 'qux');
      expect(spy).toHaveBeenCalledTimes(0);
    });

    test('should trigger a change event only if the visiblity change.', () => {
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
      });
      const spy = jest.spyOn(layer, 'dispatchEvent');
      layer.setVisible(true, 'foo', 'bar', 'qux');
      expect(layer.visible).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        type: 'change:visible',
        target: layer,
        stopPropagationDown: 'foo',
        stopPropagationUp: 'bar',
        stopPropagationSiblings: 'qux',
      });
    });
  });

  describe('#getVisibleChildren()', () => {
    test('should return only visible child.', () => {
      const layerVisible = { visible: true };
      const layerVisible2 = { visible: true };
      const layerHidden = { visible: false };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
        children: [layerVisible, layerHidden, layerVisible2],
      });
      expect(layer.getVisibleChildren()).toEqual([layerVisible, layerVisible2]);
    });
  });

  describe('#hasVisibleChildren()', () => {
    test('should return true.', () => {
      const layerVisible = { visible: true };
      const layerVisible2 = { visible: true };
      const layerHidden = { visible: false };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
        children: [layerVisible, layerHidden, layerVisible2],
      });
      expect(layer.hasVisibleChildren()).toEqual(true);
    });

    test('should return false.', () => {
      const layerHidden = { visible: false };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
        children: [layerHidden],
      });
      expect(layer.hasVisibleChildren()).toEqual(false);
    });
  });

  describe('#hasVisibleChildren()', () => {
    test('should return true for visible children.', () => {
      const layerVisible = { visible: true };
      const layerVisible2 = { visible: true };
      const layerHidden = { visible: false };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
        children: [layerVisible, layerHidden, layerVisible2],
      });
      expect(layer.hasChildren(true)).toEqual(true);
    });

    test('should return true  with hidden children.', () => {
      const layerVisible = { visible: true };
      const layerVisible2 = { visible: true };
      const layerHidden = { visible: false };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
        children: [layerVisible, layerHidden, layerVisible2],
      });
      expect(layer.hasChildren(false)).toEqual(true);
    });

    test('should return false with hidden children.', () => {
      const layerVisible = { visible: true };
      const layerVisible2 = { visible: true };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
        children: [layerVisible, layerVisible2],
      });
      expect(layer.hasChildren(false)).toEqual(false);
    });
  });

  describe('#addChild()', () => {
    test('add a child.', () => {
      const layerVisible = { visible: true };
      const layerHidden = { visible: false };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
      });
      const spy = jest.spyOn(layer, 'dispatchEvent');
      expect(layer.children).toEqual([]);
      layer.addChild(layerVisible);
      expect(layer.children).toEqual([layerVisible]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        type: 'change:children',
        target: layer,
      });
      spy.mockReset();
      layer.addChild(layerHidden);
      expect(layer.children).toEqual([layerHidden, layerVisible]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        type: 'change:children',
        target: layer,
      });
    });
  });

  describe('#removeChild()', () => {
    test('removes a child using the name', () => {
      const layerVisible = { name: 'foo', visible: true };
      const layerHidden = { name: 'bar', visible: false };
      const layer = new Layer({
        name: 'Layer',
        visible: false,
        olLayer,
        children: [layerVisible, layerHidden],
      });
      const spy = jest.spyOn(layer, 'dispatchEvent');
      expect(layer.children).toEqual([layerVisible, layerHidden]);
      layer.removeChild('foo');
      expect(layer.children).toEqual([layerHidden]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        type: 'change:children',
        target: layer,
      });
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

  describe('#onClick()', () => {
    test('adds function to clickCallbacks array', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const fn = jest.fn();
      const fn2 = jest.fn();
      layer.onClick(fn);
      expect(layer.clickCallbacks).toEqual([fn]);
      layer.onClick(fn2);
      expect(layer.clickCallbacks).toEqual([fn, fn2]);
    });

    test('triggers Error if parameter is not a function', (done) => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      try {
        layer.onClick('test');
      } catch (e) {
        expect(e).toBeDefined();
        done();
      }
    });
  });

  describe('#unClick()', () => {
    test('removes function from clickCallbacks array', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const fn = jest.fn();
      const fn2 = jest.fn();
      layer.onClick(fn);
      expect(layer.clickCallbacks).toEqual([fn]);
      layer.onClick(fn2);
      expect(layer.clickCallbacks).toEqual([fn, fn2]);
      layer.unClick(fn);
      expect(layer.clickCallbacks).toEqual([fn2]);
    });
  });

  describe('#onUserClickCallback()', () => {
    const evt = { type: 'signleclick', coordinate: [0, 0] };

    const getFeatureInfo = (layer, features = []) => {
      return {
        features,
        layer,
        coordinate: evt.coordinate,
        event: evt,
      };
    };

    test('calls click callback functions', (done) => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const goodFeatureInfo = getFeatureInfo(layer, [{ name: 'test' }]);
      const fn = jest.fn();
      const fn2 = jest.fn();
      const spy = jest
        .spyOn(layer, 'getFeatureInfoAtCoordinate')
        .mockResolvedValue(goodFeatureInfo);
      layer.onClick(fn);
      layer.onClick(fn2);
      layer.onUserClickCallback(evt).then((featureInfo) => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(evt.coordinate);
        expect(featureInfo).toBe(goodFeatureInfo);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        done();
      });
    });

    describe('returns empty feature info', () => {
      test('if isClickActive = false', (done) => {
        const layer = new Layer({
          name: 'Layer',
          isClickActive: false,
          olLayer,
        });
        layer.onClick(jest.fn());
        layer.onUserClickCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });

      test('if clickCallbacks is empty', (done) => {
        const layer = new Layer({
          name: 'Layer',
          olLayer,
        });
        layer.onUserClickCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });

      test('if an error is thrown in click callback', (done) => {
        const layer = new Layer({
          name: 'Layer',
          olLayer,
        });
        layer.onClick(() => {
          throw new Error('foo');
        });
        layer.onUserClickCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });
    });

    test('triggers Error if parameter is not a function', (done) => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      try {
        layer.onClick('test');
      } catch (e) {
        expect(e).toBeDefined();
        done();
      }
    });
  });

  describe('#onHover()', () => {
    test('adds function to clickCallbacks array', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const fn = jest.fn();
      const fn2 = jest.fn();
      layer.onHover(fn);
      expect(layer.hoverCallbacks).toEqual([fn]);
      layer.onHover(fn2);
      expect(layer.hoverCallbacks).toEqual([fn, fn2]);
    });

    test('triggers Error if parameter is not a function', (done) => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      try {
        layer.onHover('test');
      } catch (e) {
        expect(e).toBeDefined();
        done();
      }
    });
  });

  describe('#unHover()', () => {
    test('removes function from clickCallbacks array', () => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const fn = jest.fn();
      const fn2 = jest.fn();
      layer.onHover(fn);
      expect(layer.hoverCallbacks).toEqual([fn]);
      layer.onHover(fn2);
      expect(layer.hoverCallbacks).toEqual([fn, fn2]);
      layer.unHover(fn);
      expect(layer.hoverCallbacks).toEqual([fn2]);
    });
  });

  describe('#onUserMoveCallback()', () => {
    const evt = { type: 'pointermove', coordinate: [0, 0] };

    const getFeatureInfo = (layer, features = []) => {
      return {
        features,
        layer,
        coordinate: evt.coordinate,
        event: evt,
      };
    };

    test('calls hover callback functions', (done) => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      const goodFeatureInfo = getFeatureInfo(layer, [{ name: 'test' }]);
      const fn = jest.fn();
      const fn2 = jest.fn();
      const spy = jest
        .spyOn(layer, 'getFeatureInfoAtCoordinate')
        .mockResolvedValue(goodFeatureInfo);
      layer.onHover(fn);
      layer.onHover(fn2);
      layer.onUserMoveCallback(evt).then((featureInfo) => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(evt.coordinate);
        expect(featureInfo).toBe(goodFeatureInfo);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        done();
      });
    });

    describe('returns empty feature info', () => {
      test('if isHoverActive = false', (done) => {
        const layer = new Layer({
          name: 'Layer',
          isHoverActive: false,
          olLayer,
        });
        layer.onHover(jest.fn());
        layer.onUserMoveCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });

      test('if hoverCallbacks is empty', (done) => {
        const layer = new Layer({
          name: 'Layer',
          olLayer,
        });
        layer.onUserMoveCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });

      test('if an error is thrown in hover callback', (done) => {
        const layer = new Layer({
          name: 'Layer',
          olLayer,
        });
        layer.onHover(() => {
          throw new Error('foo');
        });
        layer.onUserMoveCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });
    });

    test('triggers Error if parameter is not a function', (done) => {
      const layer = new Layer({
        name: 'Layer',
        olLayer,
      });
      try {
        layer.onHover('test');
      } catch (e) {
        expect(e).toBeDefined();
        done();
      }
    });
  });
});
