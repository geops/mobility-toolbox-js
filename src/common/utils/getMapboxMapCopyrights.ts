import removeDuplicate from './removeDuplicate';

export interface Source {
  attribution: string;
  options: {
    attribution: string;
  };
}

export interface SourceCache {
  used: boolean;
  getSource: () => Source;
}

/**
 * Return the copyright a Mapbox map.
 * @param {mapboxgl.Map | maplibregl.Map} map A Mapbox map
 * @private
 */
const getMapboxMapCopyrights = (map: mapboxgl.Map | maplibregl.Map) => {
  if (!map) {
    return [];
  }
  // @ts-ignore
  const { style } = map;
  if (!style) {
    return [];
  }
  const { sourceCaches } = style;
  let copyrights: string[] = [];

  Object.values(sourceCaches as SourceCache[]).forEach(
    (sourceCache: SourceCache) => {
      if (sourceCache.used as boolean) {
        const source = sourceCache.getSource();

        const attribution = // @ts-ignore
          source.attribution || (source.options && source.options.attribution);

        if (attribution) {
          copyrights = copyrights.concat(
            attribution.replace(/&copy;/g, '©').split(/(<a.*?<\/a>)/),
          );
        }
      }
    },
  );

  return removeDuplicate(copyrights);
};

export default getMapboxMapCopyrights;
