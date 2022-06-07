import { Map, View } from 'ol';
import { MaplibreLayer, CopyrightControl } from '../../ol';
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

  // Add copyright control
  const control = new CopyrightControl();
  control.map = map;

  // Define the Mapbox style to display
  const layer = new MaplibreLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });

  // Display the Mapbox style on the map
  layer.init(map);
};
