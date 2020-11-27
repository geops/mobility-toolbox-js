import View from 'ol/View';
import { Map, MapboxLayer } from '../../ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  const layer = new MapboxLayer({
    url: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
    visible: false,
  });
  window.layer = layer;
  map.addLayer(layer);
};
