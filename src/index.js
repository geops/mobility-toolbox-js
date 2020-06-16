import Map from './ol/Map';
import {
  Layer as olLayer,
  WMSLayer as olWMSLayer,
  MapboxLayer as olMapboxLayer,
  TrajservLayer as olTrajservLayer,
  TralisLayer as olTralisLayer,
} from './ol';
import { MapboxTrajservLayer, MapboxTralisLayer } from './mapbox';

const exports = {
  mapbox: {
    MapboxTrajservLayer,
    MapboxTralisLayer,
  },
  ol: {
    Map,
    Layer: olLayer,
    WMSLayer: olWMSLayer,
    MapboxLayer: olMapboxLayer,
    TrajservLayer: olTrajservLayer,
    TralisLayer: olTralisLayer,
  },
};

export default exports;
