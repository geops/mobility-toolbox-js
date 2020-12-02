import getArrayFromString from './getArrayFromString';

describe('getArrayFromString()', () => {
  test('returns an array from a string', () => {
    expect(getArrayFromString('foo')).toEqual(['foo']);
  });

  test('returns an array from a array', () => {
    expect(getArrayFromString(['foo'])).toEqual(['foo']);
  });
});
