import { getDelayText, getTypeIndex } from './realtimeConfig';

describe('trackerConfig', () => {
  describe('#getTypeIndex()', () => {
    test("returns the type is it's not a string", () => {
      const obj = { foo: 'foo' };
      expect(getTypeIndex(obj)).toBe(obj);
      expect(getTypeIndex(0)).toBe(0);
      expect(getTypeIndex(null)).toBe(null);
      expect(getTypeIndex(undefined)).toBe(undefined);
    });

    test('find good index for new tracker values', () => {
      expect(getTypeIndex('tram')).toBe(0);
      expect(getTypeIndex('subway')).toBe(1);
      expect(getTypeIndex('bus')).toBe(3);
      expect(getTypeIndex('ferry')).toBe(4);
      expect(getTypeIndex('cablecar')).toBe(5);
      expect(getTypeIndex('gondola')).toBe(6);
      expect(getTypeIndex('funicular')).toBe(7);
      expect(getTypeIndex('coach')).toBe(8);
      expect(getTypeIndex('rail')).toBe(9);
    });
  });

  describe('#getDelayText()', () => {
    test('returns hours', () => {
      expect(getDelayText(null, null, 6400000)).toBe('+2h');
      expect(getDelayText(null, null, 4500000)).toBe('+1h');
      expect(getDelayText(null, null, 3600000)).toBe('+1h');
    });

    test('returns minutes', () => {
      expect(getDelayText(null, null, 100000)).toBe('+2m');
      expect(getDelayText(null, null, 68000)).toBe('+1m');
      expect(getDelayText(null, null, 60000)).toBe('+1m');
    });

    test('returns seconds', () => {
      expect(getDelayText(null, null, 1800)).toBe('+2s');
      expect(getDelayText(null, null, 1400)).toBe('+1s');
      expect(getDelayText(null, null, 1000)).toBe('+1s');
    });

    test('returns milliseconds', () => {
      expect(getDelayText(null, null, 100)).toBe('+100ms');
      expect(getDelayText(null, null, 999)).toBe('+999ms');
    });

    test('returns empty string', () => {
      expect(getDelayText(null, null, -45)).toBe('');
      expect(getDelayText(null, null, 'lalal')).toBe('');
      expect(getDelayText(null, null, null)).toBe('');
      expect(getDelayText(null, null)).toBe('');
    });
  });
});
