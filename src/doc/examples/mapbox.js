import View from 'ol/View';
import Map from '../../map/ol/Map';
import MapboxLayer from '../../layers/ol/MapboxLayer';
import 'ol/ol.css';

const map = new Map({
  target: 'mapbox',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

const layer = new MapboxLayer({
  url: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
});

map.addLayer(layer);
