import View from 'ol/View';
import { Map, MapboxLayer } from '../../ol';
import RoutingControl from '../../ol/controls/RoutingControl';
import 'ol/ol.css';

export default () => {
  const control = new RoutingControl();

  const mapboxLayer = new MapboxLayer({
    url: `https://maps.geops.io/styles/base_bright_v2/style.json?key=${window.apiKey}`,
  });

  const map = new Map({
    target: 'map',
    controls: [control],
    layers: [mapboxLayer],
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
  });

  control.setDrawEnabled(true);
  control.addViaPoint([950392.6037236551, 6003690.136549125]);
  control.addViaPoint([950779.6413455063, 6003844.260459255]);
  control.addViaPoint([950824.3642397508, 6003892.216256931]);

  // Add example button to toggle the copyright control.
  document.getElementById('button').addEventListener('click', () => {
    if (control.element.parentNode) {
      map.removeControl(control);
    } else {
      map.addControl(control);
    }
  });
};
