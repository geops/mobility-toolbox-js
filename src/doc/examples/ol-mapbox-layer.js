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
    copyright: 'My Mapbox layer copyright',
    url: 'https://maps.geops.io/styles/travic_v2_generalized/style.json',
    apiKey: window.apiKey,
  });
  map.addLayer(layer);
};
