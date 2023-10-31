import View from 'ol/View';
import Map from 'ol/Map';
import {
  RealtimeLayer,
  MapboxLayer,
  CopyrightControl,
} from 'mobility-toolbox-js/ol';
import { fromLonLat } from 'ol/proj';
import LINE_IMAGES from './assets/tralis-live-map';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      // center: max,
      // center: [831634, 5933959],
      zoom: 10,
      zoom: 13,
      // center: fromLonLat([7.841148, 47.996542]), // freiburg
      center: fromLonLat([11.55, 48.14]), // munich
    }),
    controls: [],
  });

  const control = new CopyrightControl();
  map.addControl(copyright);

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  layer.attachToMap(map);

  const cache = {};
  const tracker = new RealtimeLayer({
    url: 'wss://api.geops.io/realtime-ws/v1/',
    apiKey: window.apiKey,
    version: '2',
    tenant: 'sbm',
    generalizationLevelByZoom: [],
    motsByZoom: [],
    // bbox: [1152072, 6048052, 1433666, 6205578],
    style: (props) => {
      let { name } = props.properties.line || {};
      if (!name || !LINE_IMAGES[name]) {
        name = 'unknown';
      }
      if (!cache[name]) {
        const img = new Image();
        img.src = LINE_IMAGES[name].src;
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
