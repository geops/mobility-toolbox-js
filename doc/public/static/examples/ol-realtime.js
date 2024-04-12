import { Map, View } from 'ol';
import { RealtimeLayer, MaplibreLayer } from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 13,
      minZoom: 5,
    }),
  });

  const layer = new MaplibreLayer({
    apiKey: window.apiKey,
  });
  map.addLayer(layer);

  const realtime = new RealtimeLayer({
    apiKey: window.apiKey,
  });
  map.addLayer(realtime);

  const queryOptions = {
    hitTolerance: 5,
    layerFilter: (layer) => layer === realtime,
  };

  // Change mouse cursor and highlight feature if clickable
  map.on('pointermove', (evt) => {
    const [feature] = map.getFeaturesAtPixel(evt.pixel, queryOptions);
    realtime.highlight(feature);
    map.getTargetElement().style.cursor = feature ? 'pointer' : '';
  });

  // Display realtime feature informations on click.
  map.on('singleclick', (evt) => {
    const [feature] = map.getFeaturesAtPixel(evt.pixel, queryOptions);
    realtime.select(feature);

    // Display the realtime feature informations
    document.getElementById('content').innerHTML = feature
      ? JSON.stringify(feature.getProperties(), null, 2)
      : 'No feature found';
  });
};