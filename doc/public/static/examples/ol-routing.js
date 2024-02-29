import View from 'ol/View';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  MaplibreLayer,
  RoutingControl,
  routingStyle,
} from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
  });

  const baseLayer = new MaplibreLayer({
    apiKey: window.apiKey,
  });
  map.addLayer(baseLayer);

  const routingLayer = new VectorLayer({
    source: new VectorSource(),
    style: routingStyle,
  });
  map.addLayer(routingLayer);

  const control = new RoutingControl({
    element: document.createElement('div'),
    apiKey: window.apiKey,
    routingLayer: routingLayer,
  });
  map.addControl(control);

  control.addViaPoint([950476.4055933182, 6003322.253698345]);
  control.addViaPoint([950389.0813034325, 6003656.659274571]);
  control.addViaPoint('29563461696e881d');

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
