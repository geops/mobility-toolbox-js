import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import BaseLayer from '../layers/LayerCommon';
import mixin from './UserInteractionsLayerMixin';

const olLayer = new VectorLayer({ source: new VectorSource() });

const Layer = mixin(BaseLayer);

describe('Layer', () => {
  test('should initialize.', () => {
    const layer = new Layer();
    expect(layer).toBeInstanceOf(Layer);
  });

  test('should define default properties.', () => {
    const layer = new Layer();
    expect(layer).toBeInstanceOf(Layer);
    expect(layer.userInteractions).toEqual(true);
    expect(layer.userClickInteractions).toEqual(true);
    expect(layer.userHoverInteractions).toEqual(true);
    expect(layer.defaultUserInteractions).toBe(true);
    expect(layer.userClickCallbacks).toEqual([]);
    expect(layer.userHoverCallbacks).toEqual([]);
    expect(layer.userClickEventsKeys).toEqual([]);
    expect(layer.userHoverEventsKeys).toEqual([]);
  });

  test('should set userInteractionsXXX to false.', () => {
    const options = {
      userInteractions: false,
      userClickInteractions: false,
      userHoverInteractions: false,
      defaultUserInteractions: false,
    };
    const layer = new Layer(options);
    expect(layer).toBeInstanceOf(Layer);
    expect(layer.userInteractions).toBe(false);
    expect(layer.userClickInteractions).toBe(false);
    expect(layer.userHoverInteractions).toBe(false);
    expect(layer.defaultUserInteractions).toBe(false);
  });

  test('should set onClick using constructor', () => {
    const fn = () => {};
    const layer = new Layer({
      onClick: fn,
      onHover: fn,
    });
    expect(layer.userClickCallbacks[0]).toBe(fn);
    expect(layer.userHoverCallbacks[0]).toBe(fn);
    expect(layer.userClickEventsKeys.length).toBe(0);
    expect(layer.userHoverEventsKeys.length).toBe(0);
  });

  describe('#attachToMap()', () => {
    test('should not add events if no callbacks', () => {
      const layer = new Layer({
        olLayer,
      });

      expect(layer.map).toBe(undefined);
      const obj = {};
      layer.attachToMap(obj);
      expect(layer.userClickEventsKeys.length).toBe(0);
      expect(layer.userHoverEventsKeys.length).toBe(0);
    });

    test('should add events', () => {
      const fn = () => {};
      const layer = new Layer({
        olLayer,
        onClick: fn,
        onHover: fn,
      });

      expect(layer.map).toBe(undefined);
      const obj = {};
      layer.attachToMap(obj);
      expect(layer.userClickEventsKeys.length).toBe(1);
      expect(layer.userHoverEventsKeys.length).toBe(1);
    });
  });

  describe('#onClick()', () => {
    test('adds function to callback array', () => {
      const layer = new Layer();
      const fn = jest.fn();
      const fn2 = jest.fn();
      layer.onClick(fn);
      expect(layer.userClickCallbacks).toEqual([fn]);
      layer.onClick(fn2);
      expect(layer.userClickCallbacks).toEqual([fn, fn2]);
      expect(layer.userClickEventsKeys.length).toBe(0);

      layer.attachToMap({});
      expect(layer.userClickEventsKeys.length).toBe(2);
    });
  });

  describe('#onHover()', () => {
    test('adds function to callback array', () => {
      const layer = new Layer();
      const fn = jest.fn();
      const fn2 = jest.fn();
      layer.onHover(fn);
      expect(layer.userHoverCallbacks).toEqual([fn]);
      layer.onHover(fn2);
      expect(layer.userHoverCallbacks).toEqual([fn, fn2]);
      expect(layer.userHoverEventsKeys.length).toBe(0);

      layer.attachToMap({});
      expect(layer.userHoverEventsKeys.length).toBe(2);
    });
  });

  describe('#onUserClickCallback()', () => {
    const evt = { type: 'signleclick', coordinate: [0, 0] };

    const getFeatureInfo = (layer, features = []) => ({
      features,
      layer,
      coordinate: evt.coordinate,
      event: evt,
    });

    test('calls click callback functions', (done) => {
      const layer = new Layer();
      const goodFeatureInfo = getFeatureInfo(layer, [{ name: 'test' }]);
      const fn = jest.fn();
      const fn2 = jest.fn();
      const spy = jest
        .spyOn(layer, 'getFeatureInfoAtCoordinate')
        .mockResolvedValue(goodFeatureInfo);
      layer.onClick(fn);
      layer.onClick(fn2);
      layer.attachToMap({});
      layer.onUserClickCallback(evt).then((featureInfo) => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(evt.coordinate);
        expect(featureInfo).toBe(goodFeatureInfo);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn.mock.calls[0][0]).toBe(goodFeatureInfo.features);
        expect(fn.mock.calls[0][1]).toBe(goodFeatureInfo.layer);
        expect(fn.mock.calls[0][2]).toBe(goodFeatureInfo.coordinate);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn2.mock.calls[0][0]).toBe(goodFeatureInfo.features);
        expect(fn2.mock.calls[0][1]).toBe(goodFeatureInfo.layer);
        expect(fn2.mock.calls[0][2]).toBe(goodFeatureInfo.coordinate);
        done();
      });
    });

    describe('returns empty feature info', () => {
      test('if an error is thrown in click callback', (done) => {
        const layer = new Layer();
        layer.onClick(() => {
          throw new Error('foo');
        });
        const goodFeatureInfo = getFeatureInfo(layer, [{ name: 'test' }]);
        jest
          .spyOn(layer, 'getFeatureInfoAtCoordinate')
          .mockResolvedValue(goodFeatureInfo);
        layer.attachToMap({});
        layer.onUserClickCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });
    });
  });

  describe('#onUserMoveCallback()', () => {
    const evt = { type: 'pointermove', coordinate: [0, 0] };

    const getFeatureInfo = (layer, features = []) => ({
      features,
      layer,
      coordinate: evt.coordinate,
      event: evt,
    });

    test('calls hover callback functions', (done) => {
      const layer = new Layer();
      const goodFeatureInfo = getFeatureInfo(layer, [{ name: 'test' }]);
      const fn = jest.fn();
      const fn2 = jest.fn();
      const spy = jest
        .spyOn(layer, 'getFeatureInfoAtCoordinate')
        .mockResolvedValue(goodFeatureInfo);
      layer.onHover(fn);
      layer.onHover(fn2);
      layer.attachToMap({});
      layer.onUserMoveCallback(evt).then((featureInfo) => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(evt.coordinate);
        expect(featureInfo).toBe(goodFeatureInfo);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn.mock.calls[0][0]).toBe(goodFeatureInfo.features);
        expect(fn.mock.calls[0][1]).toBe(goodFeatureInfo.layer);
        expect(fn.mock.calls[0][2]).toBe(goodFeatureInfo.coordinate);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn2.mock.calls[0][0]).toBe(goodFeatureInfo.features);
        expect(fn2.mock.calls[0][1]).toBe(goodFeatureInfo.layer);
        expect(fn2.mock.calls[0][2]).toBe(goodFeatureInfo.coordinate);
        done();
      });
    });

    describe('returns empty feature info', () => {
      test('if an error is thrown in hover callback', (done) => {
        const layer = new Layer();
        layer.onHover(() => {
          throw new Error('foo');
        });
        jest
          .spyOn(layer, 'getFeatureInfoAtCoordinate')
          .mockResolvedValue(getFeatureInfo(layer, [{ name: 'test' }]));
        layer.attachToMap({});
        layer.onUserMoveCallback(evt).then((featureInfo) => {
          expect(featureInfo).toEqual(getFeatureInfo(layer));
          done();
        });
      });
    });
  });
});
