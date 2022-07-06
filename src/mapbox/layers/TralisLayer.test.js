import TralisLayer from './TralisLayer';

let layer;

describe('TralisLayer', () => {
  beforeEach(() => {
    layer = new TralisLayer();
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TralisLayer);
  });
});
