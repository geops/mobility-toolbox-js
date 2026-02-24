import { getHeight, getWidth } from 'ol/extent';
import { fromLonLat } from 'ol/proj';

import type { AnyMapGlMap } from '../../types';

/**
 * Get the current resolution of a Maplibre map.
 * @param {maplibregl.Map} map A map object.
 */
const getMercatorResolution = (map: AnyMapGlMap) => {
  const bounds = map.getBounds().toArray();
  const a = fromLonLat(bounds[0]);
  const b = fromLonLat(bounds[1]);
  const extent = [...a, ...b];
  const { height, width } = map.getCanvas();
  const xResolution = getWidth(extent) / width;
  const yResolution = getHeight(extent) / height;
  return Math.max(xResolution, yResolution);
};

export default getMercatorResolution;
