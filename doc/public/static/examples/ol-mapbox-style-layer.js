import { Map, View } from 'ol';
import {
  MaplibreLayer,
  MaplibreStyleLayer,
  CopyrightControl,
} from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  // Define the map
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
  });

  const baseLayer = new MaplibreLayer({
    apiKey: window.apiKey,
  });
  console.log(baseLayer.options);
  map.addLayer(baseLayer);
  console.log(baseLayer.options);

  // Define the list of Mapbox style layers representing the pois.
  const poiLayer = new MaplibreStyleLayer({
    maplibreLayer: baseLayer,
    styleLayersFilter: ({ id }) => /^poi_/.test(id),
  });

  map.addLayer(poiLayer);

  // Toggle pois visibility
  document.getElementById('button').addEventListener('click', (evt) => {
    poiLayer.setVisible(!poiLayer.getVisible());
    const { target } = evt;
    target.innerHTML = `${poiLayer.visible ? 'Hide' : 'Show'} the POIs`;
  });
};
