import { transformExtent } from "ol/proj";

import type { LngLatBounds } from "maplibre-gl";

/**
 * @private
 */
const toMercatorExtent = (bounds: LngLatBounds) => {
  return transformExtent(bounds.toArray().flat(), "EPSG:4326", "EPSG:3857");
};

export default toMercatorExtent;
