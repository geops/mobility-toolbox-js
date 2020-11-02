import { Map } from 'mapbox-gl';
import { TralisLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
    center: [7.47, 46.95],
    zoom: 9,
  });

  const tracker = new TralisLayer({
    url: '',
    apiKey: '',
  });

  map.on('load', () => {
    tracker.init(map, 'waterway-name');
  });
};
