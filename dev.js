import View from 'ol/View';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import {
  MaplibreLayer,
  MapsetAPI,
  MapsetLayer,
  MocoLayer,
  realtimeDefaultStyle,
  RealtimeLayer,
} from './build/ol';
import 'ol/ol.css';
import { toLonLat, transformExtent } from 'ol/proj';

window.apiKey = '5cc87b12d7c5370001c1d6554840ecb89d2743d2b0aad0588b8ba7eb';

const mocoUrl = 'https://moco.dev.geops.io/api/v2/';
const mapsUrl = 'https://maps.geops.io';

const baseLayer = new MaplibreLayer({
  apiKey: window.apiKey,
  // style: 'tralis_munich_schematic_v3',
  // style: 'de.rvf_moco',
  // url: 'https://maps.geops.io/styles/tralis_munich_schematic_v3/style.json?key=5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e',
});

const mapsetLayer = new MapsetLayer({
  apiKey: window.apiKey,
  tenants: ['rvf'],
});

const realtimeLayer = new RealtimeLayer({
  apiKey: window.apiKey,
  // apiKey: '5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e', // sbm
  url: 'wss://api.geops.io/tracker-ws/v1/', // prod
  // url: 'wss://api.geops.io/realtime-ws/v1/', // sbm
  styleOptions: {
    // useHeadingStyle: true,
    // useDelayStyle: true,
  },
  // style: realtimeByMotStyle,
  // tenant: 'sbm',
  // tenant: 'trenord',
  // bboxParameters: {
  //   line_tags: 'RVF',
  // },
});

const mocoLayer = new MocoLayer({
  apiKey: window.apiKey,
  // tenant: 'rvf',
  maplibreLayer: baseLayer,
  // publicAt: new Date(),
  // url: mocoUrl,
});

const map = new Map({
  layers: [
    baseLayer,
    // realtimeLayer,
    // mocoLayer,
    // mapsetLayer
  ],
  target: 'map',
  view: new View({
    // center: [872814.6006106276, 6106276.43], // rvf
    // center: [1022769, 5698188], // trenord
    // center: [1286668, 6130216], // sbm
    center: [2383522, 1674321], // sbm schematic
    zoom: 5.5,
  }),
});

map.on('pointermove', (evt) => {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const [feature] = map.getFeaturesAtPixel(pixel, {
    hitTolerance: 10,
    layerFilter: (l) => l === realtimeLayer,
  });

  // realtimeLayer.hoverVehicleId = feature?.get('train_id');

  realtimeLayer.highlight(feature);
  console.log(feature?.getProperties());
  map.getTargetElement().style.cursor = feature ? 'pointer' : '';
});

map.on('singleclick', (evt) => {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const [feature] = map.getFeaturesAtPixel(pixel, {
    hitTolerance: 10,
    layerFilter: (l) => l === realtimeLayer,
  });

  realtimeLayer.select([feature]);
});
map.on('moveend', () => {
  const zoom = map.getView().getZoom();
  console.log('Current zoom level:', zoom);
});

// const urlInput = document?.getElementById('url-input');
// const setUrlButton = document?.getElementById('set-url-button');
// setUrlButton.addEventListener('click', () => {
//   if (urlInput.value) {
//     mapsetLayer.url = urlInput.value;
//   }
// });

// // Fetch API plans
// let qsTimeout;
// const tagsInput = document?.getElementById('tags-input');
// const timestampInput = document?.getElementById('timestamp-input');
// const tenantsInput = document?.getElementById('tenants-input');

// tenantsInput.value = 'geopstest';

// function updateApiQuerystring() {
//   clearTimeout(qsTimeout);
//   qsTimeout = setTimeout(() => {
//     const tags = tagsInput?.value;
//     const timestamp = timestampInput?.value;
//     const tenants = tenantsInput?.value;
//     const zoom = map.getView().getZoom();
//     const bbox = transformExtent(
//       map.getView().calculateExtent(map.getSize()),
//       'EPSG:3857',
//       'EPSG:4326',
//     );
//     const qs = `?zoom=${zoom}&bbox=${bbox}&tenants=${tenants}&tags=${tags || ''}&timestamp=${timestamp || ''}`;
//     document.getElementById('querystring').value = qs;
//   }, 100);
// }

// [tagsInput, timestampInput, tenantsInput].forEach((el) => {
//   el?.addEventListener('input', updateApiQuerystring);
// });

// function zoomOnFeatures() {
//   const features = mapsetLayer.getSource().getFeatures();
//   if (features.length) {
//     map?.getView().fit(mapsetLayer?.getSource().getExtent(), {
//       duration: 500,
//       padding: [200, 200, 200, 200],
//     });
//   }
// }

// map?.getView().on('change:resolution', (evt) => {
//   document.getElementById('zoom').value = evt.target.getZoom();
//   document.getElementById('bbox').value = transformExtent(
//     evt.target.calculateExtent(map.getSize()),
//     'EPSG:3857',
//     'EPSG:4326',
//   );
//   updateApiQuerystring();
// });

// const fetchPlansButton = document.getElementById('fetch-plans-button');
// fetchPlansButton?.addEventListener('click', () => {
//   if (urlInput.value) {
//     mapsetLayer.url = urlInput.value;
//   }
//   mapsetLayer.tenants = tenantsInput.value
//     .split(',')
//     .map((t) => t.trim())
//     .filter(Boolean);
//   mapsetLayer.tags = tagsInput.value
//     .split(',')
//     .map((t) => t.trim())
//     .filter(Boolean);
//   mapsetLayer.apiKey = window.apiKey;
//   const timestamp = timestampInput.value;
//   mapsetLayer.timestamp = timestamp;
//   const latLonExtent = transformExtent(
//     map.getView().calculateExtent(map.getSize()),
//     'EPSG:3857',
//     'EPSG:4326',
//   );
//   mapsetLayer.bbox = latLonExtent;
//   mapsetLayer.once('updatefeatures', zoomOnFeatures);
// });

// // Override KML
// const kmlTextArea = document?.getElementById('kml-input');
// kmlTextArea.value = `<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"><Document><name>saveLayer</name><Placemark><Style><LineStyle><color>ffa18769</color><width>8</width></LineStyle></Style><ExtendedData><Data name="lineCap"><value>round</value></Data><Data name="lineDash"><value>10,10</value></Data><Data name="lineStartIcon"><value>{"scale":0.20833333333333331,"size":[300,300],"url":"https://editor.mapset.ch/static/images/arrowLeftW.png","zIndex":250}</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>250</value></Data></ExtendedData><LineString><coordinates>7.605494346145647,48.039455442199,0 7.62422571594322,48.02640045521156,0 7.646914417388169,48.03998462866778,0</coordinates></LineString></Placemark><Placemark><Style><IconStyle><scale>1.5</scale><Icon><href>https://editor.mapset.ch/static/images/geops/Nr.11_1_021-1_v1.png</href><gx:w>144</gx:w><gx:h>144</gx:h></Icon></IconStyle></Style><ExtendedData><Data name="iconScale"><value>0.3333333333333333</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.678949902637376,48.09794488303547,0</coordinates></Point></Placemark><Placemark><Style><LineStyle><color>00000000</color><width>2</width></LineStyle><PolyStyle><color>824149a9</color></PolyStyle></Style><ExtendedData><Data name="lineDash"><value>1,1</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>200</value></Data></ExtendedData><Polygon><outerBoundaryIs><LinearRing><coordinates>7.614041427655932,48.06979860117991,0 7.625128387295897,48.09078530093589,0 7.647302306575824,48.10083472123296,0 7.665516597412908,48.085671684092944,0 7.695233180376035,48.08425618522651,0 7.688482442381406,48.05956668611111,0 7.641758826755842,48.054802859422125,0 7.6275041643616035,48.05127381472937,0 7.614041427655932,48.06979860117991,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark><Placemark><name>Foo Fizz
// Bar</name><Style><IconStyle><scale>0</scale></IconStyle><LabelStyle><color>ff000000</color><scale>1.5</scale></LabelStyle></Style><ExtendedData><Data name="maxZoom"><value>20</value></Data><Data name="textAlign"><value>center</value></Data><Data name="textArray"><value>["Foo Fizz","","\n","","​Bar",""]</value></Data><Data name="textBackgroundFillColor"><value>rgba(196,41,55,1)</value></Data><Data name="textFont"><value>18px lato</value></Data><Data name="textPadding"><value>7,10,5,10</value></Data><Data name="textRotation"><value>-0.02099384556098904</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.694620155159875,48.03693098841495,0</coordinates></Point></Placemark></Document></kml>`;

// const loadKmlButton = document.getElementById('load-kml-button');
// loadKmlButton?.addEventListener('click', () => {
//   if (!kmlTextArea.value) {
//     alert('Please enter a valid KML');
//     return;
//   }
//   mapsetLayer.plans = [
//     {
//       data: kmlTextArea.value,
//     },
//   ];
//   mapsetLayer.once('updatefeatures', zoomOnFeatures);
// });

// // Load plan by ID
// const idInput = document?.getElementById('id-input');
// idInput.value = 'dcb03ae5-9bef-4121-ba7b-3ad55e6d569e';
// const loadPlanButton = document.getElementById('load-plan-button');
// loadPlanButton?.addEventListener('click', () => {
//   const id = idInput.value.trim();
//   if (!id) {
//     alert('Please enter a plan ID');
//     return;
//   }
//   mapsetLayer.planId = id;
//   mapsetLayer.once('updatefeatures', zoomOnFeatures);
// });
