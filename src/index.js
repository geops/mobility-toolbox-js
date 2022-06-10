import {
  Layer as olLayer,
  WMSLayer as olWMSLayer,
  MapboxLayer as olMapboxLayer,
  TralisLayer as olTralisLayer,
  VectorLayer as olVectorLayer,
} from './ol';
import { TralisLayer as mbTralisLayer } from './mapbox';

const exports = {
  mapbox: {
    TralisLayer: mbTralisLayer,
  },
  ol: {
    Layer: olLayer,
    WMSLayer: olWMSLayer,
    MapboxLayer: olMapboxLayer,
    TralisLayer: olTralisLayer,
    VectorLayer: olVectorLayer,
  },
};

export default exports;
