import View from 'ol/View';
import { Map, TralisLayer, MapboxLayer } from '../../ol';
import 'ol/ol.css';
import CopyrightControl from '../../ol/controls/CopyrightControl';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 13,
    }),
    controls: [new CopyrightControl()],
  });

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  const tracker = new TralisLayer({
    url: 'wss://api.geops.io/tracker-ws/v1/',
    apiKey: window.apiKey,
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
