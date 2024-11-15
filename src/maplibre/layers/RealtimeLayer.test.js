import Layer from './Layer';
import RealtimeLayer from './RealtimeLayer';

describe('RealtimeLayer', () => {
  test('should create a source', () => {
    const layer = new RealtimeLayer({
      attribution: ['foo', 'bar'],
      id: 'realtime',
    });
    expect(layer).toBeInstanceOf(Layer);
    expect(layer).toBeInstanceOf(RealtimeLayer);
    expect(layer.sourceId).toBe('realtime');
    expect(layer.source.canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(layer.source.type).toBe('canvas');
    expect(layer.source.coordinates).toBeDefined();
    expect(layer.source.animate).toBe(true);
    expect(layer.source.loaded).toBe(true);
    expect(layer.source.type).toBe('canvas');
    expect(layer.source.attribution).toBe('foo, bar');
  });

  test('should create a raster layer', () => {
    const layer = new RealtimeLayer({
      attribution: ['foo', 'bar'],
      id: 'realtime',
    });
    expect(layer).toBeInstanceOf(RealtimeLayer);
    expect(layer.id).toBe('realtime-custom-realtime');
    expect(layer.layer.id).toBe('realtime');
    expect(layer.layer.type).toBe('raster');
    expect(layer.sourceId).toBe('realtime');
    expect(layer.layer.layout.visibility).toBe('visible');
    expect(layer.layer.paint).toEqual({
      'raster-fade-duration': 0,
      'raster-opacity': 1,
      'raster-resampling': 'nearest', // important otherwise it looks blurry
    });
  });

  test('should define parent function', () => {
    const layer = new RealtimeLayer();
    expect(layer.source.coordinates).toBeDefined();
  });
});
