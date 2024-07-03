import removeDuplicate from './removeDuplicate';

export interface Source {
  attribution: string;
  options: {
    attribution: string;
  };
}

export interface SourceCache {
  getSource: () => Source;
  used: boolean;
}

/**
 * Return the copyright a Maplibre map.
 * @param {maplibregl.Map} map A Maplibre map
 * @private
 */
const getMapGlCopyrights = (map: maplibregl.Map) => {
  if (!map) {
    return [];
  }
  const { style } = map;
  if (!style) {
    return [];
  }
  const { sourceCaches } = style;
  let copyrights: string[] = [];

  Object.values(sourceCaches).forEach((value) => {
    if (value.used) {
      const source = value.getSource();

      // @ts-expect-error improve types
      const attribution = source.attribution || source.options?.attribution;

      if (attribution) {
        copyrights = copyrights.concat(
          attribution.replace(/&copy;/g, '©').split(/(<a.*?<\/a>)/),
        );
      }
    }
  });

  return removeDuplicate(copyrights);
};

export default getMapGlCopyrights;
