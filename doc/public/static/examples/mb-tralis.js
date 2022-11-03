import { Map } from 'maplibre-gl';
import { toLonLat } from 'ol/proj';
import { RealtimeLayer, CopyrightControl } from 'mobility-toolbox-js/mapbox';
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
  control.attachToMap(map);

  const tracker = new RealtimeLayer({
    url: '',
    apiKey: '',
  });

  map.on('load', () => {
    tracker.attachToMap(map, 'waterway-name');
  });

  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });
};
