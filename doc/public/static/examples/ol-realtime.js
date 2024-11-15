import { Map, View } from 'ol';
import { RealtimeLayer, MaplibreLayer } from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  // Creates the background layer
  const layer = new MaplibreLayer({
    apiKey: window.apiKey,
  });

  // Creates the Realtime layer
  const realtime = new RealtimeLayer({
    apiKey: window.apiKey,
  });

  // Creates the map
  const map = new Map({
    target: 'map',
    layers: [layer, realtime],
    view: new View({
      center: [831634, 5933959],
      zoom: 13,
      minZoom: 5,
    }),
  });

  // Defines options for vehicle detection on hover and on click
  const queryOptions = {
    hitTolerance: 5,
    layerFilter: (layer) => layer === realtime,
  };

  // Change mouse cursor and highlight vehicle if clickable
  map.on('pointermove', (evt) => {
    const [feature] = map.getFeaturesAtPixel(evt.pixel, queryOptions);

    // Apply the highlight style to the vehicle
    realtime.highlight(feature);

    map.getTargetElement().style.cursor = feature ? 'pointer' : '';
  });

  // Display vehicle informations on click.
  map.on('singleclick', (evt) => {
    const [feature] = map.getFeaturesAtPixel(evt.pixel, queryOptions);

    // Apply the select style to the vehicle
    realtime.select(feature);

    // Display the realtime feature informations
    document.getElementById('content').innerHTML = feature
      ? JSON.stringify(feature.getProperties(), null, 2)
      : 'No vehicle found';
  });
};
