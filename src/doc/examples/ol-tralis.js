import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { Map, TralisLayer, MapboxLayer } from '../../ol';
import 'ol/ol.css';
import CopyrightControl from '../../ol/controls/CopyrightControl';
import LINE_IMAGES from './assets/tralis-live-map';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: fromLonLat([11.55, 48.14]),
      zoom: 11,
    }),
    controls: [new CopyrightControl()],
  });

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });

  const tracker = new TralisLayer({
    url: 'wss://api.geops.io/realtime-ws/dev/',
    apiKey: window.apiKey,
    bbox: [1152072, 6048052, 1433666, 6205578],
    isUpdateBboxOnMoveEnd: true,
    style: (props) => {
      const img = new Image();
      img.src = LINE_IMAGES[(props.line || {}).name || 'unknown'];
      img.width = 25 * window.devicePixelRatio;
      img.height = 25 * window.devicePixelRatio;
      return img;
    },
  });

  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });

  map.addLayer(layer);
  map.addLayer(tracker);
};
