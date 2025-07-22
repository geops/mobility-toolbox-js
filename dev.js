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
  MocoLayer,
} from './build/ol';
import 'ol/ol.css';
import { buffer, getCenter } from 'ol/extent';
import { transformExtent } from 'ol/proj';

window.apiKey = '5cc87b12d7c5370001c1d6554840ecb89d2743d2b0aad0588b8ba7eb';

const RVF_EXTENT_4326 = [7.5, 47.7, 8.45, 48.4];

const RVF_EXTENT_3857 = transformExtent(
  RVF_EXTENT_4326,
  'EPSG:4326',
  'EPSG:3857',
);

// const bbox = RVF_EXTENT_3857.join(',');
const rvfCenter = getCenter(RVF_EXTENT_3857);
// const mocoApi = new MocoAPI();
// console.log('MocoAPI: ', mocoApi);
// mocoApi
//   .getNotifications({ addStatusProperties: true, date: new Date() })
//   .then((response) => {
//     console.log('MocoAPI response: ', response);
//   })
//   .catch((error) => {
//     console.error('Error fetching notifications: ', error);
//   });

// mocoApi
//   .getNotificationsAsFeatureCollection({
//     addStatusProperties: true,
//     date: new Date(),
//   })
//   .then((response) => {
//     console.log('MocoAPI response 2: ', response);
//   })
//   .catch((error) => {
//     console.error('Error fetching notifications: ', error);
//   });
const map = new Map({
  target: 'map',
  view: new View({
    // Zurich
    // center: [950690.34, 6003962.67],
    // rvf params:
    center: rvfCenter,
    zoom: 10,
  }),
});

const baseLayer = new MaplibreLayer({
  apiKey: window.apiKey,
  style: 'de.rvf_moco',
});
map.addLayer(baseLayer);

const mocoLayer = new MocoLayer({
  maplibreLayer: baseLayer,
  tenant: 'rvf',
  // date: new Date('2025-09-10T00:00:00Z'),
  // notifications: [
  //   {
  //     type: 'FeatureCollection',
  //     properties: {
  //       id: 372776,
  //       affected_time_intervals: [
  //         {
  //           start: '2025-07-16T09:53:00Z',
  //           end: '2026-01-31T10:53:00Z',
  //           time_of_day_start: null,
  //           time_of_day_end: null,
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-07-16T09:53:00Z',
  //           visible_until: '2026-01-31T10:53:00Z',
  //           channel: 'DEFAULT',
  //           index: 0,
  //         },
  //       ],
  //       links: [],
  //       images: [],
  //       sso_config: 'rvf',
  //       title: 'Test Olivier Baustellen Icon',
  //       long_description: '<p></p><p></p>',
  //       category: 'DISRUPTION',
  //       start_stop: null,
  //       end_stop: null,
  //       size: 'M',
  //       default_language: 'de',
  //       title_de: '',
  //       title_fr: '',
  //       title_it: '',
  //       title_en: '',
  //       summary_de: '',
  //       summary_fr: '',
  //       summary_it: '',
  //       summary_en: '',
  //       reason_de: '',
  //       reason_fr: '',
  //       reason_it: '',
  //       reason_en: '',
  //       description_de: '',
  //       description_fr: '',
  //       description_it: '',
  //       description_en: '',
  //       consequence_de: '',
  //       consequence_fr: '',
  //       consequence_it: '',
  //       consequence_en: '',
  //       duration_text_de: '',
  //       duration_text_fr: '',
  //       duration_text_it: '',
  //       duration_text_en: '',
  //       recommendation_de: '',
  //       recommendation_fr: '',
  //       recommendation_it: '',
  //       recommendation_en: '',
  //       reasons: [
  //         {
  //           name: 'Bauarbeiten',
  //           category_name: 'Technische Probleme',
  //         },
  //       ],
  //     },
  //     features: [
  //       {
  //         type: 'Feature',
  //         geometry: {
  //           type: 'GeometryCollection',
  //           geometries: [
  //             {
  //               type: 'MultiLineString',
  //               coordinates: [
  //                 [
  //                   [7.8407629, 47.9976417],
  //                   [7.8392181, 47.9956185],
  //                   [7.8388936, 47.9952356],
  //                   [7.8386947, 47.9950218],
  //                   [7.8384108, 47.9947526],
  //                   [7.8380985, 47.994413],
  //                   [7.8368156, 47.9927414],
  //                   [7.8358579, 47.9915824],
  //                   [7.8354873, 47.9912014],
  //                   [7.8351931, 47.9909404],
  //                   [7.8347127, 47.9905598],
  //                   [7.8338045, 47.9898814],
  //                   [7.8335515, 47.9896813],
  //                   [7.8333915, 47.9895502],
  //                   [7.8330709, 47.9892549],
  //                   [7.8328081, 47.9889703],
  //                   [7.8326371, 47.9887606],
  //                   [7.8312279, 47.9869586],
  //                   [7.8307153, 47.9862716],
  //                   [7.8305208, 47.9859568],
  //                   [7.8303354, 47.9856163],
  //                   [7.83014, 47.9850787],
  //                   [7.8300422, 47.9846474],
  //                   [7.8300134, 47.9844463],
  //                   [7.8299849, 47.9840377],
  //                   [7.8299854, 47.9838421],
  //                   [7.8299991, 47.98365],
  //                   [7.8300606, 47.9832408],
  //                   [7.8301049, 47.9830608],
  //                   [7.8301581, 47.9828987],
  //                   [7.8303579, 47.9823999],
  //                   [7.8304637, 47.9821919],
  //                   [7.8305602, 47.9820268],
  //                   [7.8307651, 47.9817381],
  //                   [7.8310239, 47.9814693],
  //                   [7.8312993, 47.9812478],
  //                   [7.8314977, 47.9811074],
  //                   [7.8316265, 47.981028],
  //                   [7.8319596, 47.9808514],
  //                   [7.8323491, 47.9806874],
  //                   [7.8326678, 47.9805751],
  //                   [7.8395337, 47.9783842],
  //                   [7.8400986, 47.9782221],
  //                   [7.8404738, 47.9781315],
  //                   [7.8407542, 47.9780815],
  //                   [7.8415426, 47.9779725],
  //                   [7.841862, 47.9779416],
  //                   [7.8422848, 47.9779229],
  //                   [7.8429746, 47.9779376],
  //                   [7.8437005, 47.9780116],
  //                   [7.8442791, 47.9781033],
  //                   [7.8445816, 47.9781669],
  //                   [7.8448517, 47.9782296],
  //                   [7.8451824, 47.9783267],
  //                   [7.8457854, 47.9785354],
  //                   [7.8462674, 47.9787433],
  //                   [7.8465396, 47.9788815],
  //                   [7.8467435, 47.9789946],
  //                   [7.848202, 47.9798678],
  //                   [7.8488439, 47.9802292],
  //                   [7.8488183, 47.9802385],
  //                   [7.8491591, 47.9804256],
  //                   [7.8496107, 47.9806426],
  //                   [7.8501096, 47.9808449],
  //                   [7.8516554, 47.9813942],
  //                   [7.8549883, 47.9825315],
  //                 ],
  //                 [
  //                   [7.8549883, 47.9825315],
  //                   [7.8585318, 47.9837596],
  //                   [7.8595929, 47.9841761],
  //                   [7.8602711, 47.9844194],
  //                   [7.8609517, 47.9846273],
  //                   [7.8611318, 47.9846707],
  //                   [7.8616726, 47.9847623],
  //                   [7.8618228, 47.9847777],
  //                   [7.8627388, 47.9848238],
  //                   [7.8657203, 47.9849385],
  //                   [7.8672775, 47.9850355],
  //                   [7.8675543, 47.9850712],
  //                   [7.868149, 47.9851731],
  //                   [7.8704429, 47.9856081],
  //                   [7.8715154, 47.9857248],
  //                   [7.8720517, 47.9857397],
  //                   [7.8725915, 47.98572],
  //                   [7.8730456, 47.9856808],
  //                   [7.873747, 47.9855902],
  //                   [7.8834769, 47.9841235],
  //                   [7.8853988, 47.9838487],
  //                   [7.8862027, 47.9837171],
  //                   [7.8873554, 47.9835097],
  //                   [7.8885522, 47.9832639],
  //                   [7.895159545, 47.981790004],
  //                 ],
  //               ],
  //             },
  //           ],
  //         },
  //         properties: {
  //           graph: 'osm',
  //           is_icon_ref: false,
  //           stops: [
  //             {
  //               uid: '3a888fcdb9a5371e',
  //               name: 'Freiburg(Breisgau) Hbf',
  //               external_id: '8000107',
  //               external_code: 'RF',
  //             },
  //             {
  //               uid: 'a33509cdf7463912',
  //               name: 'Freiburg-Littenweiler',
  //               external_id: '8002068',
  //               external_code: 'RFLT',
  //             },
  //           ],
  //           affected_products: [
  //             {
  //               name: 'S1',
  //               operator: '',
  //             },
  //           ],
  //           disruption_type: 'DISRUPTION',
  //           periods: [],
  //           severity: 'verySevere',
  //           severity_group: 'high',
  //           condition: 'majorDelays',
  //           condition_group: 'changes',
  //         },
  //       },
  //       {
  //         type: 'Feature',
  //         geometry: {
  //           type: 'Point',
  //           coordinates: [7.8951595447, 47.9817900039],
  //         },
  //         properties: {
  //           external_id: '8002068',
  //           external_code: 'RFLT',
  //           external_ifopt: 'DE:08311:6540',
  //           name: 'Freiburg-Littenweiler',
  //           affected_stops: [
  //             {
  //               severity: 'verySevere',
  //               severity_group: 'high',
  //               condition: 'majorDelays',
  //               condition_group: 'changes',
  //             },
  //             {
  //               severity: 'verySevere',
  //               severity_group: 'high',
  //               condition: 'majorDelays',
  //               condition_group: 'changes',
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         type: 'Feature',
  //         geometry: {
  //           type: 'Point',
  //           coordinates: [7.841207566, 47.99766809369999],
  //         },
  //         properties: {
  //           external_id: '8000107',
  //           external_code: 'RF',
  //           external_ifopt: 'DE:08311:6508',
  //           name: 'Freiburg(Breisgau) Hbf',
  //           affected_stops: [
  //             {
  //               severity: 'verySevere',
  //               severity_group: 'high',
  //               condition: 'majorDelays',
  //               condition_group: 'changes',
  //             },
  //             {
  //               severity: 'verySevere',
  //               severity_group: 'high',
  //               condition: 'majorDelays',
  //               condition_group: 'changes',
  //             },
  //           ],
  //         },
  //       },
  //     ],
  //   },
  // ],
});

map.addLayer(mocoLayer);

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
// map.addLayer(realtimeLayer);

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

document.getElementById('toggleMocoLayer').onclick = () => {
  if (map.getLayers().getArray().includes(mocoLayer)) {
    console.log('Removing MocoLayer');
    map.removeLayer(mocoLayer);
  } else {
    console.log('Add MocoLayer');
    map.addLayer(mocoLayer);
    mocoLayer.maplibreLayer?.mapLibreMap?.on('load', () => {
      console.log('MocoLayer mapLibreMap load event');
    });
    mocoLayer.maplibreLayer?.mapLibreMap?.on('idle', () => {
      console.log('MocoLayer mapLibreMap load event');
    });
    mocoLayer.maplibreLayer?.mapLibreMap.redraw();
    window.mbMap = mocoLayer.maplibreLayer?.mapLibreMap;
    console.log(
      'Source data',
      mocoLayer.maplibreLayer?.mapLibreMap?.getSource('rvf_moco'),
    );
    console.log(
      'layer data',
      mocoLayer.maplibreLayer?.mapLibreMap,
      mocoLayer.maplibreLayer?.mapLibreMap.getLayer('moco-notification-line'),
    );
  }
};
