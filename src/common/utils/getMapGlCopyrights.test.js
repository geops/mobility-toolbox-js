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
            'also used': {
              getSource() {
                return {
                  attribution:
                    '<a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.imagico.de/" target="_blank">&copy; imagico</a>',
                };
              },
              used: true,
            },
            'not used': {
              used: false,
            },
            used: {
              getSource() {
                return {
                  attribution:
                    '<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/about/" target="_blank">&copy; OpenStreetMap contributors</a>',
                };
              },
              used: true,
            },
          },
        },
      }),
    ).toEqual([
      '<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a>',
      '<a href="https://www.imagico.de/" target="_blank">© imagico</a>',
      '<a href="https://www.openstreetmap.org/about/" target="_blank">© OpenStreetMap contributors</a>',
    ]);
  });
});
