import Map from './ol/Map';
import olLayer from './ol/layers/Layer';
import olWMSLayer from './ol/layers/WMSLayer';
import olMapboxLayer from './ol/layers/MapboxLayer';

const exports = {
  Map,
  layers: {
    Layer: olLayer,
    WMSLayer: olWMSLayer,
    MapboxLayer: olMapboxLayer,
  },
};

export default exports;
