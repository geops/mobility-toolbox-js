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
    apiKey: window.apiKey,
    id: 'id',
  });

  map.on('load', () => {
    const layer = map.addLayer(realtime);

    // Display informations on click in the console
    realtime.onClick(([feature]) => {
      if (feature) {
        // eslint-disable-next-line no-console
        console.log(feature);
      }
    });
  });
  document.getElementById('button').onclick = () => {
    const prop = map.getLayoutProperty('id', 'visibility');
    map.setLayoutProperty(
      'id-raster',
      'visibility',
      prop === 'none' ? 'visible' : 'none',
    );
  };
};
