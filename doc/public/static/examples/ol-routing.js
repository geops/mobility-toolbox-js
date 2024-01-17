import View from 'ol/View';
import Map from 'ol/Map';
import {
  MaplibreLayer,
  CopyrightControl,
  RoutingControl,
  RoutingAPI,
} from 'mobility-toolbox-js/ol';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
    controls: [],
  });

  const mapboxLayer = new MaplibreLayer({
    url: `https://maps.geops.io/styles/travic_v2/style.json`,
    apiKey: window.apiKey,
  });
  mapboxLayer.attachToMap(map);

  const copyright = new CopyrightControl();
  copyright.attachToMap(map);

  const control = new RoutingControl({
    element: document.createElement('div'),
    apiKey: window.apiKey,
  });
  control.attachToMap(map);

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
