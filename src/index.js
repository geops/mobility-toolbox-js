import Map from './ol/Map';
import {
  Layer as olLayer,
  WMSLayer as olWMSLayer,
  MapboxLayer as olMapboxLayer,
  TrajservLayer as olTrajservLayer,
  TralisLayer as olTralisLayer,
  VectorLayer as olVectorLayer,
} from './ol';
import {
  TrajservLayer as mbTrajservLayer,
  TralisLayer as mbTralisLayer,
} from './mapbox';

const exports = {
  mapbox: {
    TrajservLayer: mbTrajservLayer,
    TralisLayer: mbTralisLayer,
  },
  ol: {
    Map,
    Layer: olLayer,
    WMSLayer: olWMSLayer,
    MapboxLayer: olMapboxLayer,
    TrajservLayer: olTrajservLayer,
    TralisLayer: olTralisLayer,
    VectorLayer: olVectorLayer,
  },
};

export default exports;
