import { Map } from 'maplibre-gl';
import { RealtimeLayer, CopyrightControl } from 'mobility-toolbox-js/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

export default () => {
  // Creates the MapLibre GL map
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
    center: [7.47, 46.95],
    zoom: 12,
    touchPitch: false,
    pitchWithRotate: false,
    attributionControl: false,
  });

  // Display a better copyright
  map.addControl(new CopyrightControl());

  // Creates the realtime layer
  const realtime = new RealtimeLayer({
    id: 'realtime',
    apiKey: window.apiKey,
  });

  // Add the layer when the map is ready
  map.on('load', () => {
    map.addLayer(realtime);
  });

  // Toggle visiblity on button click
  document.getElementById('button').onclick = () => {
    map.setLayoutProperty(
      'realtime',
      'visibility',
      map.getLayoutProperty('realtime', 'visibility') === 'none'
        ? 'visible'
        : 'none',
    );
  };
};
