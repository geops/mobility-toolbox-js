import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import { Map, Layer, TrajservLayer } from '../../ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 9,
    }),
  });

  const osm = new Layer({
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  });

  const tracker = new TrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: window.apiKey,
  });

  map.addLayer(osm);
  map.addLayer(tracker);
};
