import Map from './ol/Map';
import {
  Layer as olLayer,
  WMSLayer as olWMSLayer,
  MapboxLayer as olMapboxLayer,
  TrajservLayer as olTrajservLayer,
  VectorLayer as olVectorLayer,
} from './ol';
import { TrajservLayer as mbTrajservLayer } from './mapbox';

const exports = {
  mapbox: {
    TrajservLayer: mbTrajservLayer,
  },
  ol: {
    Map,
    Layer: olLayer,
    WMSLayer: olWMSLayer,
    MapboxLayer: olMapboxLayer,
    TrajservLayer: olTrajservLayer,
    VectorLayer: olVectorLayer,
  },
};

export default exports;
