import removeDuplicate from './removeDuplicate';

describe('removeDuplicate()', () => {
  test('removes duplicates', () => {
    expect(
      removeDuplicate([
        'a',
        ' ',
        '   ',
        'b',
        'a',
        undefined,
        null,
        0,
        'c',
        'b',
      ]),
    ).toEqual(['a', 'b', 'c']);
  });
});
