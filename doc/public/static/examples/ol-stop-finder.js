import View from 'ol/View';
import Map from 'ol/Map';
import { MaplibreLayer, StopFinderControl } from 'mobility-toolbox-js/ol';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
    controls: [],
  });

  const control = new StopFinderControl({
    apiKey: window.apiKey,
  });
  map.addControl(control);

  const layer = new MaplibreLayer({
    apiKey: window.apiKey,
  });
  map.addLayer(layer);

  map.on('singleclick', () => control.clear());
};
