import { Map } from 'maplibre-gl';
import { TralisLayer, CopyrightControl } from '../../../../src/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';

export default () => {
  // Define the map
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
    center: [7.47, 46.95],
    zoom: 12,
    touchPitch: false,
    pitchWithRotate: false,
    attributionControl: false,
  });

  const control = new CopyrightControl();
  control.attachToMap(map);

  // Define the layer
  const tracker = new TralisLayer({
    url: 'wss://api.geops.io/tracker-ws/v1/',
    apiKey: window.apiKey,
  });

  // Add the layer to the map
  tracker.attachToMap(map);

  // Remove the layer from the map
  // tracker.detachFromMap(map);

  // Display informations on click in the console
  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(`trajectory: ${feature.getProperties()}`);
    }
  });
};
