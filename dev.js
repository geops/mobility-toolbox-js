import View from 'ol/View';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import {
  MaplibreLayer,
  RealtimeLayer,
  RoutingControl,
  routingStyle,
  MocoAPI,
} from './build/ol';
import 'ol/ol.css';
import { buffer } from 'ol/extent';

window.apiKey = '5cc87b12d7c5370001c1d6554840ecb89d2743d2b0aad0588b8ba7eb';

const mocoApi = new MocoAPI();
console.log('MocoAPI: ', mocoApi);
mocoApi
  .getNotifications({ addStatusProperties: true, date: new Date() })
  .then((response) => {
    console.log('MocoAPI response: ', response);
  })
  .catch((error) => {
    console.error('Error fetching notifications: ', error);
  });

mocoApi
  .getNotificationsAsFeatureCollection({
    addStatusProperties: true,
    date: new Date(),
  })
  .then((response) => {
    console.log('MocoAPI response 2: ', response);
  })
  .catch((error) => {
    console.error('Error fetching notifications: ', error);
  });
const map = new Map({
  target: 'map',
  view: new View({
    center: [950690.34, 6003962.67],
    zoom: 6,
  }),
});

const baseLayer = new MaplibreLayer({
  apiKey: window.apiKey,
});
map.addLayer(baseLayer);

const francfortExtent = buffer(
  [967387.0927876673, 6464738.161156644, 967387.0927876673, 6464738.161156644],
  100000,
);

const realtimeLayer = new RealtimeLayer({
  apiKey: window.apiKey,
  // styleOptions: { useDelayStyle: true },
  extent: francfortExtent,
  styleOptions: {
    delayDisplay: 0,
    // Define the circle color
    // @param {string} mot - The mode of transport
    // @param {object} line - The line object
    // @return {string} The color in rgba format
    getBgColor: (mot, line) => {
      if (mot === 'bus') {
        return 'rgba(0, 255, 0, 1)';
      }
      if (mot === 'subway') {
        return 'rgba(0, 0, 255, 1)';
      }
      // S-Bahn
      if (/^S/.test(line?.name)) {
        return 'rgba(0, 255, 255, 1)';
      }
      // Rail
      return 'rgba(255, 0, 0, 1)';
    },

    // Define the maximum radius of the circle when to display the stroke representing the delay
    // @param {string} mot - The mode of transport
    // @param {number} delay - The delay in seconds
    // @return {number} a radius in pixel
    getMaxRadiusForStrokeAndDelay: (mot, delay) => {
      return 7;
    },

    // Define the maximum radius of the circle when to display the text
    // @param {string} mot - The mode of transport
    // @param {number} zoom - The current zoom level
    // @return {number} a radius in pixel
    getMaxRadiusForText: (mot, zoom) => {
      return 6;
    },

    // Define the radius of the circle
    // @param {string} mot - The mode of transport
    // @param {number} zoom - The current zoom level
    // @return {number} a radius in pixel
    getRadius: (mot, zoom) => {
      return 7;
    },
  },
  // filter: (traj) => {
  //   return traj.properties.state === 'JOURNEY_CANCELLED';
  // },
});
map.addLayer(realtimeLayer);

map.on('moveend', () => {
  console.log('center: ', map.getView().getCenter());
  console.log('zoom: ', map.getView().getZoom());
  console.log('resolution: ', map.getView().getResolution());
});

// const routingLayer = new VectorLayer({
//   source: new VectorSource(),
//   style: routingStyle,
// });
// // map.addLayer(routingLayer);

// // const control = new RoutingControl({
// //   element: document.createElement('div'),
// //   apiKey: window.apiKey,
// //   routingLayer: routingLayer,
// // });
// // map.addControl(control);

// const vectorLayer = new VectorLayer({
//   source: new VectorSource(),
// });
// vectorLayer.getSource().addFeature(
//   new Feature({
//     geometry: new LineString([
//       // [950476.4055933182, 6003322.253698345],
//       // [950389.0813034325, 6003656.659274571],
//       // [
//       [950478.7985399539, 6003320.7265438335],
//       [950483.7500754321, 6003337.644331005],
//       [950518.7823191849, 6003431.357665203],
//       [950420.9547506756, 6003448.256090432],
//       [950349.999707244, 6003582.770702608],
//       [950351.0015826611, 6003608.825650063],
//       [950361.1427882726, 6003611.801014977],
//       [950368.5900622065, 6003616.61749184],
//       [950379.0986221373, 6003626.80936295],
//       [950388.2936120768, 6003641.22594949],
//       [950393.3361623707, 6003652.514778154],
//       // ]
//     ]),
//   }),
// );
// map.addLayer(vectorLayer);

// const modify = new Modify({
//   source: vectorLayer.getSource(),
//   hitDetection: vectorLayer,
// });
// map.addInteraction(modify);

// control.addViaPoint([950476.4055933182, 6003322.253698345]);
// control.addViaPoint([950389.0813034325, 6003656.659274571]);
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

map.on('pointermove', (e) => {
  const feature = map.getFeaturesAtPixel(e.pixel)[0];
  realtimeLayer.highlight(feature);
});

map.on('singleclick', (e) => {
  const feature = map.getFeaturesAtPixel(e.pixel)[0];
  realtimeLayer.select(feature);
  console.log(feature);
});

let map2 = new Map({
  pixelRatio: 3,
  target: 'map2',
  view: new View({
    center: map.getView().getCenter(),
    zoom: map.getView().getZoom(),
  }),
});

map.once('rendercomplete', (e) => {
  console.log('map first rendercomplete');
  map.on('rendercomplete', (e) => {
    console.log('map first rendercomplete');
  });
});

map2.once('rendercomplete', (e) => {
  console.log('map2 first rendercomplete');
  map2.on('rendercomplete', (e) => {
    console.log('map2 rendercomplete');
  });
});

document.getElementById('map2ToMap').onclick = () => {
  const layers = [...map2.getLayers().getArray()];
  map2.getLayers().clear();
  map.setLayers(layers);
  map.once('rendercomplete', (e) => {
    console.log('map1 rendercomplete');
  });
};

document.getElementById('mapToMap2').onclick = () => {
  const layers = [...map.getLayers().getArray()];
  map.getLayers().clear();
  map2.setLayers(layers);
  map2.once('rendercomplete', (e) => {
    console.log('map2 rendercomplete');
  });
};
