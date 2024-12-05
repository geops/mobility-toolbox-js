import { Map, View } from 'ol';
import { MaplibreLayer, MaplibreStyleLayer } from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  // Creates the background layer
  const baseLayer = new MaplibreLayer({
    apiKey: window.apiKey,
  });

  // Create the POIs layer
  const poiLayer = new MaplibreStyleLayer({
    maplibreLayer: baseLayer,
    layersFilter: (layer) => {
      return layer['source-layer'] === 'poi';
    },
  });

  // Creates the map
  const map = new Map({
    layers: [baseLayer, poiLayer],
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
  });

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
      ? JSON.stringify(feature.get('vectorTileFeature'), null, 2)
      : 'No feature found';
  });
};
