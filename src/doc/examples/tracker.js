/* eslint-disable no-unused-vars */
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import Map from '../../map/ol/Map';
import Layer from '../../layers/ol/Layer';
import TrajservLayer from '../../layers/ol/TrajservLayer';
import 'ol/ol.css';

export default () => {
  const osmLayer = new Layer({
    name: 'Demo Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  });

  const trackerLayer = new TrajservLayer({
    apiKey: '5cc87b12d7c5370001c1d6556afe39038efb48709f6b5af1adf48bce',
  });

  const map = new Map({
    layers: [osmLayer, trackerLayer],
    target: 'tracker',
    view: new View({
      center: [831634, 5933959],
      zoom: 9,
    }),
  });
};
