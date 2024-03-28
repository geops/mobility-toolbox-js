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
  });

  // Define the Maplibre style to display
  const layer = new MaplibreLayer({
    apiKey: window.apiKey,
  });

  map.addLayer(layer);

  // Change mouse cursor if a feature is clickable
  map.on('pointermove', (evt) => {
    const has = map.hasFeatureAtPixel(evt.pixel);
    map.getTargetElement().style.cursor = has ? 'pointer' : '';
  });

  // Display maplibre feature informations on click.
  map.on('singleclick', (evt) => {
    const [feature] = map.getFeaturesAtPixel(evt.pixel);

    // Display the maplibre feature informations
    document.getElementById('content').innerHTML = feature
      ? JSON.stringify(feature.get('vectorTileFeature'), null, 2)
      : 'No feature found';
  });

  // Toggle between 2 different styles
  document.getElementById('change').onclick = () => {
    layer.style = layer.style === 'travic_v2' ? 'aerial' : 'travic_v2';
  };
};
