import View from 'ol/View';
import Map from 'ol/Map';
import { MapboxLayer, CopyrightControl, StopFinderControl } from '../../ol';
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
  copyright.map = map;

  const stopFinder = new StopFinderControl({
    apiKey: window.apiKey,
  });
  stopFinder.map = map;

  const mapboxLayer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  mapboxLayer.init(map);

  map.on('singleclick', () => stopFinder.clear());
};
