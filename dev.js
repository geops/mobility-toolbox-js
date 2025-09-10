import View from 'ol/View';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import { MaplibreLayer, CopyrightControl, MapsetLayer } from './build/ol';
import 'ol/ol.css';
import { buffer, getCenter } from 'ol/extent';
import { transformExtent } from 'ol/proj';

window.apiKey = '5cc87b12d7c5370001c1d6554840ecb89d2743d2b0aad0588b8ba7eb';

const baseLayer = new MaplibreLayer({
  apiKey: window.apiKey,
});

const mapsetLayer = new MapsetLayer();

// Creates the map
const map = new Map({
  layers: [baseLayer, mapsetLayer],
  target: 'map',
  view: new View({
    center: [950690.34, 6003962.67],
    zoom: 20,
  }),
});

map.addControl(new CopyrightControl());
