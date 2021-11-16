import { Map } from 'mapbox-gl/dist/mapbox-gl-unminified';
import { toLonLat } from 'ol/proj';
import { TralisLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
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

  tracker.onClick(({ features: [feature] }) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });
};
