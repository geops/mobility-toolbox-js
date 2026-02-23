import removeDuplicate from './removeDuplicate';

import type { Style } from 'maplibre-gl';

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

  // @ts-expect-error -  sourceCaches exists in maplibre-gl < 5.11.0
  const { sourceCaches, tileManagers } = style;
  let copyrights: string[] = [];
  const sourceCacheObj =
    tileManagers || (sourceCaches as Style['tileManagers']) || {};
  Object.values(sourceCacheObj).forEach((value) => {
    if (value.used) {
      const source = value.getSource();

      const attribution =
        source?.attribution ||
        (source as unknown as { options: { attribution: string } }).options
          ?.attribution;

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
