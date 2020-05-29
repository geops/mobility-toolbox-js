import View from 'ol/View';
import Map from '../../map/ol/Map';
import MapboxLayer from '../../layers/ol/MapboxLayer';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'mapbox',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic/style.json?key=5cc87b12d7c5370001c1d6551c10432b24d74f74bcd3b7d88a5b7eab',
  });

  map.addLayer(layer);
};
