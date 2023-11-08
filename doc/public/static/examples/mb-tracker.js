import { Map } from 'maplibre-gl/dist/maplibre-gl-dev';
import { RealtimeLayer, CopyrightControl } from 'mobility-toolbox-js/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';

export default () => {
  // Define the map
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
    center: [7.47, 46.95],
    zoom: 12,
    minZoom: 4,
    touchPitch: false,
    pitchWithRotate: false,
    attributionControl: false,
  });

  map.addControl(new CopyrightControl());

  // Define the layer
  const realtime = new RealtimeLayer({
    url: 'wss://api.geops.io/tracker-ws/v1/',
    apiKey: window.apiKey,
    key: 'test',
  });

  map.on('load', () => {
    // console.log(realtime.source.id, realtime.source);
    // map.addSource(realtime.source.id, realtime.source);
    const layer = map.addLayer(realtime);

    // Display informations on click in the console
    realtime.onClick(([feature]) => {
      if (feature) {
        // eslint-disable-next-line no-console
        console.log(feature);
      }
    });
  });
};
