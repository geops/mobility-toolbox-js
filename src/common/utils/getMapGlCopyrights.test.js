import getMapGlCopyrights from './getMapGlCopyrights';

describe('getMapGlCopyrights()', () => {
  test('returns an empty array if map is not defined', () => {
    expect(getMapGlCopyrights().length).toBe(0);
  });

  test('returns an empty array if map.style is not defined', () => {
    expect(getMapGlCopyrights({}).length).toBe(0);
  });

  test('returns non depluicated copyrights in an array', () => {
    expect(
      getMapGlCopyrights({
        style: {
          sourceCaches: {
            used: {
              used: true,
              getSource() {
                return {
                  attribution:
                    '<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/about/" target="_blank">&copy; OpenStreetMap contributors</a>',
                };
              },
            },
            'not used': {
              used: false,
            },
            'also used': {
              used: true,
              getSource() {
                return {
                  attribution:
                    '<a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.imagico.de/" target="_blank">&copy; imagico</a>',
                };
              },
            },
          },
        },
      }),
    ).toEqual([
      '<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a>',
      '<a href="https://www.openstreetmap.org/about/" target="_blank">© OpenStreetMap contributors</a>',
      '<a href="https://www.imagico.de/" target="_blank">© imagico</a>',
    ]);
  });
});
