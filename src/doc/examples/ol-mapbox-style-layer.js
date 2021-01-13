import View from 'ol/View';
import { Map, MapboxLayer, MapboxStyleLayer } from '../../ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
  });

  const mapboxLayer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/base_bright_v2/style.json',
    apiKey: window.apiKey,
  });

  const poiLayer = new MapboxStyleLayer({
    copyrights: 'My Mapbox style layer copyright',
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
    target.innerHTML = `Set service icons ${
      poiLayer.visible ? 'invisible' : 'visible'
    }`;
  });
};
