import { Map } from 'mapbox-gl/dist/mapbox-gl-unminified';
import { toLonLat } from 'ol/proj';
import { MapboxTrajservLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
    center: toLonLat([831634, 5933959]),
    zoom: 9,
  });

  const tracker = new MapboxTrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: window.apiKey,
  });

  tracker.onClick((vehicles) => {
    // eslint-disable-next-line no-console
    console.log(vehicles);
  });

  map.on('load', () => {
    tracker.init(map, 'waterway-name');
  });
};
