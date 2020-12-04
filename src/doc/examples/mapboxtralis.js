import { Map } from 'mapbox-gl/dist/mapbox-gl-unminified';
import { toLonLat } from 'ol/proj';
import { TralisLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
    center: toLonLat([1282278, 6128615]),
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
