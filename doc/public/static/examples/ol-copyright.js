import { Map, View } from 'ol';
import { MaplibreLayer, CopyrightControl } from 'mobility-toolbox-js/ol';
import { Source } from 'ol/source';

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
  });

  // Attach to the map
  map.addControl(control);

  // Define the Maplibre style to display
  const layer = new MaplibreLayer({
    apiKey: window.apiKey,
    source: new Source({
      attributions: ['My Custom Attribution'],
    }),
  });
  map.addLayer(layer);

  // Toggle the copyright control.
  document.getElementById('button').addEventListener('click', () => {
    if (control.getMap()) {
      map.removeControl(control);
    } else {
      map.addControl(control);
    }
  });
};
