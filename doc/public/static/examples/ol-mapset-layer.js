import View from 'ol/View';
import Map from 'ol/Map';
import { MapsetLayer, MaplibreLayer, MapsetAPI } from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  const baseLayer = new MaplibreLayer({
    apiKey: window.apiKey,
  });

  const mapsetLayer = new MapsetLayer({
    tenants: ['geopstest'],
    apiKey: window.apiKey,
    api: new MapsetAPI({
      apiKey: window.apiKey,
    }),
    planId: 'dcb03ae5-9bef-4121-ba7b-3ad55e6d569e',
  });

  const map = new Map({
    layers: [baseLayer, mapsetLayer],
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
  });

  mapsetLayer.once('updatefeatures', () => {
    const features = mapsetLayer.getSource().getFeatures();
    if (features.length) {
      map?.getView().fit(mapsetLayer?.getSource().getExtent(), {
        duration: 500,
        padding: [200, 200, 200, 200],
      });
    }
  });
};
