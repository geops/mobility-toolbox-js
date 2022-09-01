import View from 'ol/View';
import Map from 'ol/Map';
import {
  MapboxLayer,
  CopyrightControl,
  StopFinderControl,
} from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
    controls: [],
  });

  const copyright = new CopyrightControl();
  copyright.attachToMap(map);

  const stopFinder = new StopFinderControl({
    apiKey: window.apiKey,
  });
  stopFinder.attachToMap(map);

  const mapboxLayer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  mapboxLayer.attachToMap(map);

  map.on('singleclick', () => stopFinder.clear());
};
