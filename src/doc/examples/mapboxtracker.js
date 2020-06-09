import { Map } from 'mapbox-gl/dist/mapbox-gl-unminified';
import { toLonLat } from 'ol/proj';
import { TrajservLayer } from '../../mapbox';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
    center: toLonLat([831634, 5933959]),
    zoom: 9,
    fadeDuration: 0,
  });

  const tracker = new TrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: '5cc87b12d7c5370001c1d6556afe39038efb48709f6b5af1adf48bce',
  });
  window.map = map;

  map.on('load', () => {
    tracker.init(map);
  });
};
