import View from 'ol/View';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import { MaplibreLayer, RoutingControl, routingStyle } from './build/ol';
import 'ol/ol.css';

window.apiKey = '5cc87b12d7c5370001c1d655f23526a2a5b14ff5bf1c6c4eb6c4c9b4';

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
// map.addLayer(routingLayer);

// const control = new RoutingControl({
//   element: document.createElement('div'),
//   apiKey: window.apiKey,
//   routingLayer: routingLayer,
// });
// map.addControl(control);

const vectorLayer = new VectorLayer({
  source: new VectorSource(),
});
vectorLayer.getSource().addFeature(
  new Feature({
    geometry: new LineString([
      // [950476.4055933182, 6003322.253698345],
      // [950389.0813034325, 6003656.659274571],
      // [
      [950478.7985399539, 6003320.7265438335],
      [950483.7500754321, 6003337.644331005],
      [950518.7823191849, 6003431.357665203],
      [950420.9547506756, 6003448.256090432],
      [950349.999707244, 6003582.770702608],
      [950351.0015826611, 6003608.825650063],
      [950361.1427882726, 6003611.801014977],
      [950368.5900622065, 6003616.61749184],
      [950379.0986221373, 6003626.80936295],
      [950388.2936120768, 6003641.22594949],
      [950393.3361623707, 6003652.514778154],
      // ]
    ]),
  }),
);
map.addLayer(vectorLayer);

const modify = new Modify({
  source: vectorLayer.getSource(),
  hitDetection: vectorLayer,
});
map.addInteraction(modify);

control.addViaPoint([950476.4055933182, 6003322.253698345]);
control.addViaPoint([950389.0813034325, 6003656.659274571]);
// control.addViaPoint('29563461696e881d');

// Add example button to toggle the RoutingControl.
// document.getElementById('control-button').addEventListener('click', (e) => {
//   e.target.innerHTML = control.active
//     ? 'Activate RoutingControl'
//     : 'Deactivate RoutingControl';
//   if (control.active) {
//     control.active = false;
//   } else {
//     control.active = true;
//   }
// });

// // Add example button to toggle the RoutingControl mot.
// document.getElementById('mot-button').addEventListener('click', (e) => {
//   e.target.innerHTML =
//     control.mot === 'bus' ? 'Switch to bus routing' : 'Switch to foot routing';
//   control.mot = control.mot === 'bus' ? 'foot' : 'bus';
// });

// // Add example button to toggle the RoutingControl mot.
// document.getElementById('reset-button').addEventListener('click', () => {
//   control.reset();
// });
