import View from 'ol/View';
import { Map, MapboxLayer } from '../../ol';
import RoutingControl from '../../ol/controls/RoutingControl';
import 'ol/ol.css';

export default () => {
  // Define a custom copyright
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
  control.addViaPoint([949335.971405072, 6003355.951087987]);
  control.addViaPoint([951605.1956822881, 6004177.649142052]);

  // Add example button to toggle the copyright control.
  document.getElementById('button').addEventListener('click', () => {
    if (control.element.parentNode) {
      map.removeControl(control);
    } else {
      map.addControl(control);
    }
  });
};
