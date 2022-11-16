import { Map, View } from 'ol';
import {
  RealtimeLayer,
  MaplibreLayer,
  CopyrightControl,
} from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 13,
      minZoom: 5,
    }),
    controls: [],
  });

  const control = new CopyrightControl();
  control.attachToMap(map);

  const layer = new MaplibreLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  layer.attachToMap(map);

  const tracker = new RealtimeLayer({
    url: 'wss://api.geops.io/tracker-ws/v1/',
    apiKey: window.apiKey,
    // allowRenderWhenAnimating: true,
  });
  tracker.attachToMap(map);

  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });
};
