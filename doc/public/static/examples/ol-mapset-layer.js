import { Map, View } from 'ol';
import { MapsetLayer, MaplibreLayer } from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  // Creates the background layer
  const baseLayer = new MaplibreLayer({
    apiKey: window.apiKey,
  });

  const mapsetLayer = new MapsetLayer({});

  // Creates the map
  const map = new Map({
    layers: [baseLayer, mapsetLayer],
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
  });

  console.log(mapsetLayer);
};
