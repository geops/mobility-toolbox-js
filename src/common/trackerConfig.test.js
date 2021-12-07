import { getTypeIndex } from './trackerConfig';

describe('trackerConfig', () => {
  describe('#getTypeIndex()', () => {
    test("retrurn the type is it's not a string", () => {
      const obj = { foo: 'foo' };
      expect(getTypeIndex(obj)).toBe(obj);
      expect(getTypeIndex(0)).toBe(0);
      expect(getTypeIndex(null)).toBe(null);
      expect(getTypeIndex(undefined)).toBe(undefined);
    });

    test('find good index for old trajserv values', () => {
      expect(getTypeIndex('Tram')).toBe(0);
      expect(getTypeIndex('Subway / Metro / S-Bahn')).toBe(1);
      expect(getTypeIndex('Train')).toBe(2);
      expect(getTypeIndex('Bus')).toBe(3);
      expect(getTypeIndex('Ferry')).toBe(4);
      expect(getTypeIndex('Cable Car')).toBe(5);
      expect(getTypeIndex('Gondola')).toBe(6);
      expect(getTypeIndex('Funicular')).toBe(7);
      expect(getTypeIndex('Long distance bus')).toBe(8);
      expect(getTypeIndex('Rail')).toBe(9);
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
});
