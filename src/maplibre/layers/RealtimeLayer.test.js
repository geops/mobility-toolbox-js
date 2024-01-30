import RealtimeLayer from './RealtimeLayer';

let layer;

describe('RealtimeLayer', () => {
  beforeEach(() => {
    layer = new RealtimeLayer();
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(RealtimeLayer);
  });
});
