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
    planId: 'dcb03ae5-9bef-4121-ba7b-3ad55e6d569e',
  });

  const map = new Map({
    layers: [baseLayer, mapsetLayer],
    target: 'map',
  });

  mapsetLayer.once('updatefeatures', () => {
    const source = mapsetLayer.getSource();
    const features = source.getFeatures();
    if (features.length) {
      map?.getView().fit(source.getExtent(), {
        duration: 500,
        padding: [100, 100, 100, 100],
      });
    }
  });
};
