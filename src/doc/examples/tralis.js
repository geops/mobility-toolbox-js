import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import { Map, Layer, TralisLayer } from '../../ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [1282278, 6128615],
      zoom: 9,
    }),
  });
  window.map = map;
  const osm = new Layer({
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  });

  const tracker = new TralisLayer({
    copyrights: 'My tralis copyright',
    url: '',
    apiKey: '',
  });

  map.addLayer(osm);
  map.addLayer(tracker);
};
