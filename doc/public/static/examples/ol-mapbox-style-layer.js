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
  map.addLayer(baseLayer);

  // Define the list of Maplibre style layers representing the pois.
  const poiLayer = new MaplibreStyleLayer({
    maplibreLayer: baseLayer,
    layersFilter: ({ id }) => /^poi_/.test(id),
  });

  map.addLayer(poiLayer);

  // Toggle pois visibility
  document.getElementById('button').addEventListener('click', (evt) => {
    poiLayer.setVisible(!poiLayer.getVisible());
    const { target } = evt;
    target.innerHTML = `${poiLayer.visible ? 'Hide' : 'Show'} the POIs`;
  });

  // Change mouse cursor if a POI is clickable
  map.on('pointermove', (evt) => {
    const has = map.hasFeatureAtPixel(evt.pixel, {
      layerFilter: (layer) => layer === poiLayer,
      hitTolerance: 5,
    });
    map.getTargetElement().style.cursor = has ? 'pointer' : '';
  });

  // Display POI feature informations on click.
  map.on('singleclick', (evt) => {
    const [feature] = map.getFeaturesAtPixel(evt.pixel, {
      layerFilter: (layer) => layer === poiLayer,
      hitTolerance: 5,
    });

    // Display the maplibre feature informations
    document.getElementById('content').innerHTML = feature
      ? JSON.stringify(feature.get('mapboxFeature'), null, 2)
      : 'No feature found';
  });
};
