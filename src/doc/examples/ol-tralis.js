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
  const osm = new Layer({
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  });

  const tracker = new TralisLayer({
    url: '',
    apiKey: '',
  });

  tracker.onClick(({ features: [feature] }) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });

  map.addLayer(osm);
  map.addLayer(tracker);
};
