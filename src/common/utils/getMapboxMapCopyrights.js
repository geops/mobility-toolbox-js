import removeDuplicate from './removeDuplicate';

/**
 * Return the copyright a Mapbox map.
 * @param {mapboxgl.Map} map A Mapbox map
 * @ignores
 */
const getMapboxMapCopyrights = (map) => {
  if (!map || !map.style) {
    return [];
  }
  const { sourceCaches } = map.style;
  let copyrights = [];
  Object.values(sourceCaches).forEach((sourceCache) => {
    if (sourceCache.used) {
      const source = sourceCache.getSource();
      const attribution =
        source.attribution || (source.options && source.options.attribution);
      if (attribution) {
        copyrights = copyrights.concat(
          attribution.replace(/&copy;/g, '©').split(/(<a.*?<\/a>)/),
        );
      }
    }
  });

  return removeDuplicate(copyrights);
};

export default getMapboxMapCopyrights;
