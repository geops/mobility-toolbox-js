import { AnyMapGlMap } from '../../types';

/**
 * Get the canvas source coordinates of the current map's extent.
 * @param {maplibregl.Map} map A map object.
 * @param {number} [pixelRatio=1] The pixel ratio.
 */
export const getSourceCoordinates = (map: AnyMapGlMap, pixelRatio = 1) => {
  // Requesting getBounds is not enough when we rotate the map, so we request manually each corner.
  const { height, width } = map.getCanvas();
  // @ts-expect-error - to fix
  const leftTop = map.unproject({ x: 0, y: 0 });
  // @ts-expect-error - to fix
  const leftBottom = map.unproject({ x: 0, y: height / pixelRatio }); // southWest

  // @ts-expect-error - to fix
  const rightBottom = map.unproject({
    x: width / pixelRatio,
    y: height / pixelRatio,
  });
  // @ts-expect-error - to fix
  const rightTop = map.unproject({ x: width / pixelRatio, y: 0 }); // north east
  return [
    [leftTop.lng, leftTop.lat],
    [rightTop.lng, rightTop.lat],
    [rightBottom.lng, rightBottom.lat],
    [leftBottom.lng, leftBottom.lat],
  ];
};

export default getSourceCoordinates;
