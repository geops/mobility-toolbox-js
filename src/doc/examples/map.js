import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import Map from '../../map/ol/Map';
import Layer from '../../layers/ol/Layer';
import 'ol/ol.css';

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

const layer = new Layer({
  olLayer: new TileLayer({
    source: new OSMSource(),
  }),
});

map.addLayer(layer);
