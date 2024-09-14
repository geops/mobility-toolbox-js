import { Map } from 'maplibre-gl';
import { RealtimeLayer, CopyrightControl } from 'mobility-toolbox-js/maplibre';
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

  map.addControl(new CopyrightControl());

  // Define the layer
  const realtime = new RealtimeLayer({
    apiKey: window.apiKey,
  });

  map.on('load', () => {
    map.addLayer(realtime);
  });

  document.getElementById('button').onclick = () => {
    const prop = map.getLayoutProperty('realtime', 'visibility');
    map.setLayoutProperty(
      'realtime',
      'visibility',
      prop === 'none' ? 'visible' : 'none',
    );
  };
};
