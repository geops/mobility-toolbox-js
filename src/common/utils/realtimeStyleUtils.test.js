import { getDelayText, getTypeIndex } from './realtimeStyleUtils';

describe('trackerConfig', () => {
  describe('#getTypeIndex()', () => {
    test("returns the type is it's not a string", () => {
      const obj = { foo: 'foo' };
      expect(getTypeIndex(obj)).toBe(obj);
      expect(getTypeIndex(0)).toBe(0);
      expect(getTypeIndex(null)).toBe(10);
      expect(getTypeIndex(undefined)).toBe(10);
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
      expect(getDelayText(6400000)).toBe('+2h');
      expect(getDelayText(4500000)).toBe('+1h');
      expect(getDelayText(3600000)).toBe('+1h');
    });

    test('returns minutes', () => {
      expect(getDelayText(100000)).toBe('+2m');
      expect(getDelayText(68000)).toBe('+1m');
      expect(getDelayText(60000)).toBe('+1m');
    });

    test('returns seconds', () => {
      expect(getDelayText(1800)).toBe('+2s');
      expect(getDelayText(1400)).toBe('+1s');
      expect(getDelayText(1000)).toBe('+1s');
    });

    test('returns milliseconds', () => {
      expect(getDelayText(100)).toBe('+100ms');
      expect(getDelayText(999)).toBe('+999ms');
    });

    test('returns empty string', () => {
      expect(getDelayText(-45)).toBe('');
      expect(getDelayText('lalal')).toBe('');
      expect(getDelayText(null)).toBe('');
      expect(getDelayText(null, null)).toBe('');
    });
  });
});
