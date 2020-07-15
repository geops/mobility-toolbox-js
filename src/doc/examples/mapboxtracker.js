import { Map } from 'mapbox-gl';
import { toLonLat } from 'ol/proj';
import { TrajservLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
    center: toLonLat([831634, 5933959]),
    zoom: 12,
  });

  const tracker = new TrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: window.apiKey,
  });

  tracker.onClick((vehicle) => {
    // eslint-disable-next-line no-console
    console.log(vehicle);
  });

  map.on('load', () => {
    tracker.init(map, 'waterway-name');
  });
};
