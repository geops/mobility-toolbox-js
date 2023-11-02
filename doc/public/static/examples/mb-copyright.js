import { Map } from 'maplibre-gl';
import { CopyrightControl } from 'mobility-toolbox-js/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';

export default () => {
  // Define the map
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
    center: [7.47, 46.95],
    zoom: 12,
    attributionControl: false,
  });

  // Define a custom copyright
  const control = new CopyrightControl({
    customAttribution: ['My Custom Attribution'],
  });

  // Add the control inside the map
  map.addControl(control);

  // Aplly default maplibre-gl css
  control.container.className = 'maplibregl-ctrl maplibregl-ctrl-attrib';

  const toggle = () => {
    if (control.map) {
      map.removeControl(control);
    } else {
      map.addControl(control);
    }
  };

  // Add the control outside the map
  // const container = document.getElementById('copyright');
  // container.appendChild(control.onAdd(map));

  // const toggle = () => {
  //   if (control.map) {
  //     control.onRemove();
  //   } else {
  //     container.appendChild(control.onAdd(map));
  //   }
  // };

  // // Add example button to toggle the copyright control.
  document.getElementById('button').addEventListener('click', toggle);
};
