import View from 'ol/View';
import { Map, MapboxLayer, StopsFinderControl } from '../../ol';
import 'ol/ol.css';

export default () => {
  const control = new StopsFinderControl({
    apiKey: window.apiKey,
  });

  const mapboxLayer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/base_bright_v2/style.json',
    apiKey: window.apiKey,
  });

  const map = new Map({
    target: 'map',
    layers: [mapboxLayer],
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
  });

  map.addControl(control);
};
