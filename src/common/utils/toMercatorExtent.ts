import { transformExtent } from 'ol/proj';

const toMercatorExtent = (bounds: maplibregl.LngLatBounds) => {
  return transformExtent(bounds.toArray().flat(), 'EPSG:4326', 'EPSG:3857');
};

export default toMercatorExtent;
