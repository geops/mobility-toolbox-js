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
        'A',
        0,
        'c',
        'b',
        'B',
      ]),
    ).toEqual(['a', 'b', 'c']);
  });
});
