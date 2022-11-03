import { getWidth, getHeight } from 'ol/extent';
import { fromLonLat } from 'ol/proj';
import { AnyMapboxMap } from '../../types';

/**
 * Get the current resolution of a Mapbox map.
 * @param {mapboxgl.Map} map A map object.
 * @private
 */
const getMercatorResolution = (map: AnyMapboxMap) => {
  const bounds = map.getBounds().toArray();
  const a = fromLonLat(bounds[0]);
  const b = fromLonLat(bounds[1]);
  const extent = [...a, ...b];
  const { width, height } = map.getCanvas();
  const xResolution = getWidth(extent) / width;
  const yResolution = getHeight(extent) / height;
  return Math.max(xResolution, yResolution);
};

export default getMercatorResolution;
