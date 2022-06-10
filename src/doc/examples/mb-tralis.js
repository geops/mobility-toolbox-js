import { Map } from 'maplibre-gl';
import { toLonLat } from 'ol/proj';
import { TralisLayer, CopyrightControl } from '../../mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
    center: toLonLat([1282278, 6128615]),
    zoom: 9,
    attributionControl: false,
  });

  const control = new CopyrightControl();
  control.map = map;

  const tracker = new TralisLayer({
    url: '',
    apiKey: '',
  });

  map.on('load', () => {
    tracker.init(map, 'waterway-name');
  });

  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });
};
