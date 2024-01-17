import { Map, View } from 'ol';
import {
  RealtimeLayer,
  MaplibreLayer,
  CopyrightControl,
} from 'mobility-toolbox-js/ol';

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

  map.addControl(new CopyrightControl());

  const layer = new MaplibreLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  map.addLayer(layer);

  const realtime = new RealtimeLayer({
    url: 'wss://api.geops.io/tracker-ws/v1/',
    apiKey: window.apiKey,
  });
  map.addLayer(realtime);

  let maxZoom = 20;
  realtime.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });
};
