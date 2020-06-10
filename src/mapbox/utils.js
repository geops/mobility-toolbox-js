import { fromLonLat } from 'ol/proj';
import { getWidth, getHeight } from 'ol/extent';

/**
 * Get the current resolution of a Mapbox map.
 * @param {mapbox.Map} map A map object.
 */
export const getResolution = (map) => {
  const bounds = map.getBounds().toArray();
  const extent = [...fromLonLat(bounds[0]), ...fromLonLat(bounds[1])];
  const { width, height } = map.getCanvas();
  const xResolution = getWidth(extent) / width;
  const yResolution = getHeight(extent) / height;
  return Math.max(xResolution, yResolution);
};

/**
 * Get the canvas source coordinates of the current map's extent.
 * @param {mapbox.Map} map A map object.
 */
export const getSourceCoordinates = (map) => {
  const bounds = map.getBounds().toArray();
  return [
    [bounds[0][0], bounds[1][1]],
    [...bounds[1]],
    [bounds[1][0], bounds[0][1]],
    [...bounds[0]],
  ];
};

export default {
  getResolution,
  getSourceCoordinates,
};
