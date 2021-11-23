import { Map, TrajservLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
    center: [7.47, 46.95],
    zoom: 12,
    touchPitch: false,
    pitchWithRotate: false,
  });

  const tracker = new TrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: window.apiKey,
  });

  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(`trajectory: ${feature.getProperties()}`);
    }
  });

  map.addLayer(tracker);
};
