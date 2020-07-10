import View from 'ol/View';
import { Map, MapboxLayer, MapboxStyleLayer } from '../../ol';
import 'ol/ol.css';

import './mapboxstyle.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
  });

  const url = `https://maps.geops.io/styles/base_bright_v1/style.json?key=${window.apiKey}`;
  const mapboxLayer = new MapboxLayer({ url });

  const poiLayer = new MapboxStyleLayer({
    name: 'poi layer',
    visible: true,
    mapboxLayer,
    styleLayer: {
      id: 'poi_with_icons',
    },
  });

  map.addLayer(mapboxLayer);
  map.addLayer(poiLayer);

  document.getElementById('toggle').addEventListener('click', (evt) => {
    poiLayer.setVisible(!poiLayer.visible);
    const { target } = evt;
    target.innerHTML = `Set pois ${poiLayer.visible ? 'invisible' : 'visible'}`;
  });
};
