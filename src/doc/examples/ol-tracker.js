import View from 'ol/View';
import { Map, TrajservLayer, MapboxLayer } from '../../ol';
import 'ol/ol.css';
import CopyrightControl from '../../ol/controls/CopyrightControl';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 7,
    }),
    controls: [new CopyrightControl()],
  });

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/base_bright_v2/style.json',
    apiKey: window.apiKey,
  });

  const tracker = new TrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: window.apiKey,
    useRequestAnimationFrame: true,
  });

  tracker.onClick((vehicle) => {
    // eslint-disable-next-line no-console
    console.log(vehicle);
  });

  map.addLayer(layer);
  map.addLayer(tracker);
};
