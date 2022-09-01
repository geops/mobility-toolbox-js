import { Map, View } from 'ol';
import { MaplibreLayer, CopyrightControl } from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  // Define the map
  const map = new Map({
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
    controls: [],
  });

  // Define a custom rendering for the copyright
  const control = new CopyrightControl({
    target: document.getElementById('copyright'),
    element: document.createElement('div'),
    render() {
      this.element.innerHTML = this.active
        ? this.getCopyrights().join(' | ')
        : '';
    },
  });

  // Attach to the map
  control.attachToMap(map);

  // Define the Mapbox style to display
  const mapboxLayer = new MaplibreLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });

  // Display the Mapbox style on the map
  mapboxLayer.attachToMap(map);

  // Toggle the copyright control.
  document.getElementById('button').addEventListener('click', () => {
    control.map = control.map ? null : map;
  });
};
