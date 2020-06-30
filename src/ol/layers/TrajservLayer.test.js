import TrajservLayer from './TrajservLayer';

let layer;
let onClick;

describe('TrajservLayer', () => {
  beforeEach(() => {
    onClick = jest.fn();
    layer = new TrajservLayer({
      onClick,
    });
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TrajservLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });
});
