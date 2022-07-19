import { Map } from 'mapbox-gl';
import { RealtimeLayer, CopyrightControl } from 'mobility-toolbox-js/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import LINE_IMAGES from './assets/tralis-live-map';

export default () => {
  const map = new Map({
    container: 'map',
    style: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
    center: [11.55, 48.14],
    zoom: 10,
    touchPitch: false,
    pitchWithRotate: false,
    attributionControl: false,
  });

  const control = new CopyrightControl();
  control.attachToMap(map);

  const cache = {};
  const tracker = new RealtimeLayer({
    url: 'wss://api.geops.io/realtime-ws/v1/',
    isUpdateBboxOnMoveEnd: false,
    apiKey: window.apiKey,
    bbox: [1152072, 6048052, 1433666, 6205578],
    style: (props) => {
      let { name } = props.line || {};
      if (!name || !LINE_IMAGES[name]) {
        name = 'unknown';
      }
      if (!cache[name]) {
        const img = new Image();
        img.src = LINE_IMAGES[name];
        img.width = 25 * window.devicePixelRatio;
        img.height = 25 * window.devicePixelRatio;
        cache[name] = img;
      }
      return cache[name];
    },
  });

  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });

  tracker.attachToMap(map);
};
