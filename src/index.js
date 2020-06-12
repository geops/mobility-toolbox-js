import Map from './ol/Map';
import {
  Layer as olLayer,
  WMSLayer as olWMSLayer,
  MapboxLayer as olMapboxLayer,
  TrajservLayer as olTrajservLayer,
} from './ol';
import { MapboxTrajservLayer } from './mapbox';

const exports = {
  mapbox: {
    MapboxTrajservLayer,
  },
  ol: {
    Map,
    Layer: olLayer,
    WMSLayer: olWMSLayer,
    MapboxLayer: olMapboxLayer,
    TrajservLayer: olTrajservLayer,
  },
};

export default exports;
