import View from 'ol/View';
import { Map, MapboxLayer } from '../../ol';
import RoutingControl from '../../ol/controls/RoutingControl';
import 'ol/ol.css';

export default () => {
  const control = new RoutingControl({
    element: document.createElement('div'),
    apiKey: `${window.apiKey}`,
  });

  const mapboxLayer = new MapboxLayer({
    url: `https://maps.geops.io/styles/base_bright_v2/style.json?key=${window.apiKey}`,
  });

  // eslint-disable-next-line no-unused-vars
  const map = new Map({
    target: 'map',
    layers: [mapboxLayer],
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
  });

  map.addControl(control);

  // control.addViaPoint([950476.4055933182, 6003322.253698345]);
  // control.addViaPoint([950389.0813034325, 6003656.659274571]);
  control.addViaPoint('29563461696e881d');
  control.addViaPoint([950476.4055933182, 6003322.253698345]);
  control.addViaPoint('d2909bcd3c57a5b4');

  // Add example button to toggle the RoutingControl.
  document.getElementById('control-button').addEventListener('click', (e) => {
    e.target.innerHTML = control.active
      ? 'Activate RoutingControl'
      : 'Deactivate RoutingControl';
    if (control.active) {
      control.active = false;
    } else {
      control.active = true;
    }
  });

  // Add example button to toggle the RoutingControl mot.
  document.getElementById('mot-button').addEventListener('click', (e) => {
    e.target.innerHTML =
      control.mot === 'bus'
        ? 'Switch to bus routing'
        : 'Switch to foot routing';
    control.mot = control.mot === 'bus' ? 'foot' : 'bus';
  });

  // Add example button to toggle the RoutingControl mot.
  document.getElementById('reset-button').addEventListener('click', () => {
    control.reset();
  });
};
