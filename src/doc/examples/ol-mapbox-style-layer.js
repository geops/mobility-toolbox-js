import { Map, View } from 'ol';
import { MaplibreLayer, MapboxStyleLayer, CopyrightControl } from '../../ol';
import 'ol/ol.css';

export default () => {
  // Define the map
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
    controls: [],
  });

  // Add copyright control
  const control = new CopyrightControl();
  control.map = map;

  // Define the Mapbox style to display
  const mapboxLayer = new MaplibreLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });

  // Display the style on the map
  mapboxLayer.init(map);

  // Define the list of Mapbox style layers representing the pois.
  const poiLayer = new MapboxStyleLayer({
    mapboxLayer,
    styleLayersFilter: ({ id }) => /^poi_/.test(id),
  });

  // Display the pois on the map
  poiLayer.init(map);

  // Toggle pois visibility
  document.getElementById('button').addEventListener('click', (evt) => {
    poiLayer.setVisible(!poiLayer.visible);
    const { target } = evt;
    target.innerHTML = `${poiLayer.visible ? 'Hide' : 'Show'} the POIs`;
  });
};
