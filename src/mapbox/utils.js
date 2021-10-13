import { getWidth, getHeight } from 'ol/extent';

/**
 * Get the current resolution of a Mapbox map.
 * @param {mapboxgl.Map} map A map object.
 * @private
 */
export const getResolution = (map) => {
  const bounds = map.getBounds().toArray();
  const extent = [...bounds[0], ...bounds[1]];
  const { width, height } = map.getCanvas();
  const xResolution = getWidth(extent) / width;
  const yResolution = getHeight(extent) / height;
  return Math.max(xResolution, yResolution);
};

/**
 * Get the canvas source coordinates of the current map's extent.
 * @param {mapboxgl.Map} map A map object.
 * @private
 */
export const getSourceCoordinates = (map, pixelRatio) => {
  // Requesting getBounds is not enough when we rotate the map, so we request manually each corner.
  const { width, height } = map.getCanvas();
  const leftTop = map.unproject({ x: 0, y: 0 });
  const leftBottom = map.unproject({ x: 0, y: height / pixelRatio }); // southWest
  const rightBottom = map.unproject({
    x: width / pixelRatio,
    y: height / pixelRatio,
  });
  const rightTop = map.unproject({ x: width / pixelRatio, y: 0 }); // north east
  return [
    [leftTop.lng, leftTop.lat],
    [rightTop.lng, rightTop.lat],
    [rightBottom.lng, rightBottom.lat],
    [leftBottom.lng, leftBottom.lat],
  ];
};

export default {
  getResolution,
  getSourceCoordinates,
};
