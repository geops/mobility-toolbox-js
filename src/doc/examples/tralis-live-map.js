import { Map, TralisLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
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
    dragRotate: false,
    touchZoomRotate: false,
  });

  const tracker = new TralisLayer({
    url: 'wss://api.geops.io/realtime-ws/v1/',
    apiKey: window.apiKey,
    style: (props) => {
      const img = new Image();
      img.src = LINE_IMAGES[(props.line || {}).name || 'unknown'];
      img.width = 25 * tracker.pixelRatio;
      img.height = 25 * tracker.pixelRatio;
      return img;
    },
  });

  map.addLayer(tracker);
};
