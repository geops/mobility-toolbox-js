// We load statically the readme to have the content when the page use server side rendering.
import olTrackerReadme from '../public/static/examples/ol-realtime.md';
import mbTrackerReadme from '../public/static/examples/mb-realtime.md';
import olRoutingReadme from '../public/static/examples/ol-routing.md';
import olStopFinderReadme from '../public/static/examples/ol-stop-finder.md';
// import tralisLiveMapReadme from '../public/static/examples/tralis-live-map.md';

// import munichAssets from '../public/static/examples/tralis-live-map';

// It's important that the key
// are differents from the name of js and html files.
export default [
  {
    name: 'Live tracker with OpenLayers',
    key: 'ol-realtime',
    description:
      'Use the [geOps Realtime API](https://developer.geops.io/apis/realtime/) to show moving trains in a OpenLayers map.',
    img: '/static/img/live_tracker_ol.jpg',
    readme: olTrackerReadme,
  },
  {
    name: 'Live tracker with Maplibre',
    key: 'mb-realtime',
    description:
      'Use the [geOps Realtime API](https://developer.geops.io/apis/realtime/) to show moving trains in a Maplibre map.',
    img: '/static/img/live_tracker_mb.jpg',
    readme: mbTrackerReadme,
  },
  {
    name: 'Stop finder',
    key: 'ol-stop-finder',
    description:
      'Use the [geOps Stops API](https://developer.geops.io/apis/stops/) for finding public transport stops.',
    img: '/static/img/stops.jpg',
    readme: olStopFinderReadme,
  },
  {
    name: 'Routing',
    key: 'routing-control',
    description:
      'Use the [geOps Routing API](https://developer.geops.io/apis/routing/) to find the shortest route between 2 points.',
    img: '/static/img/routing.jpg',
    readme: olRoutingReadme,
    files: {
      html: 'ol-routing.html',
      js: 'ol-routing.js',
    },
  },
  {
    name: 'Maplibre layer',
    key: 'ol-maplibre-layer',
    description: 'Display a Maplibre style on an OpenLayers map.',
    img: '/static/img/mapbox.jpg',
  },
  {
    name: 'Maplibre Style layer',
    key: 'ol-maplibre-style-layer',
    description:
      'Display/hide a set of layers of a Maplibre style on an OpenLayers map.',
    img: '/static/img/mapbox_style.jpg',
  },
];
