import { Map, View } from 'ol';
import Base from 'ol/layer/Base';
import Layer from 'ol/layer/Layer';
import {
  MaplibreLayer,
  CopyrightControl,
  OLLayer,
} from 'mobility-toolbox-js/ol';
import 'ol/ol.css';
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

  // Define the Mapbox style to display
  const layer = new MaplibreLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
    source: new Source({
      attributions: ['My Custom Attribution'],
    }),
  });

  // Display the Mapbox style on the map
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
