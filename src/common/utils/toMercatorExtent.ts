import { transformExtent } from 'ol/proj';

/**
 * @private
 */
const toMercatorExtent = (bounds: maplibregl.LngLatBounds) => {
  return transformExtent(bounds.toArray().flat(), 'EPSG:4326', 'EPSG:3857');
};

export default toMercatorExtent;
