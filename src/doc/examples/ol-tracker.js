import View from 'ol/View';
import { Map, TralisLayer, MapboxLayer } from '../../ol';
import 'ol/ol.css';
import CopyrightControl from '../../ol/controls/CopyrightControl';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [955156.2377088447, 6096616.996190854],
      zoom: 7,
    }),
    controls: [new CopyrightControl()],
  });

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  const tracker = new TralisLayer({
    url: 'wss://tralis-tracker-api.geops.io/ws',
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
