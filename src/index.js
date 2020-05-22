import Map from './map/ol/Map';
import olLayer from './layers/ol/Layer';
import olWMSLayer from './layers/ol/WMSLayer';
import olMapboxLayer from './layers/ol/MapboxLayer';

const exports = {
  Map,
  layers: {
    ol: {
      Layer: olLayer,
      WMSLayer: olWMSLayer,
      MapboxLayer: olMapboxLayer,
    },
  },
};

export default exports;
