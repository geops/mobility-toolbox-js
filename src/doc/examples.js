import simpleMapImg from './img/examples/simple_map.jpg';
import liveTrackerOLImg from './img/examples/live_tracker_ol.jpg';
import liveTrackerMBImg from './img/examples/live_tracker_mb.jpg';
import liveTrackerMunichImg from './img/examples/live_tracker_munich.jpg';
import mapboxImg from './img/examples/mapbox.jpg';
import mapboxStyleImg from './img/examples/mapbox_style.jpg';
import queryObjectsImg from './img/examples/query_objects.jpg';
import olCopyrightImg from './img/examples/ol-copyright.png';
import stopsImg from './img/examples/stops.jpg';
import routingImg from './img/examples/routing.jpg';

const munichAssets = require('./examples/assets/tralis-live-map').default;

// To make redirect works properly on netlify it's important that the key
// are differents from the name of js and html files.
export default [
  {
    name: 'Simple map',
    key: 'ol-map',
    description: 'A simple map example.',
    img: simpleMapImg,
  },
  {
    name: 'Live tracker with OpenLayers',
    key: 'ol-tracker',
    description: 'Show moving trains in an OpenLayers map.',
    img: liveTrackerOLImg,
  },
  {
    name: 'Live tracker with Mapbox',
    key: 'mb-tracker',
    description: 'Show moving trains in a Mapbox map.',
    img: liveTrackerMBImg,
  },
  {
    name: 'Live train positions for Munich',
    key: 'tralis-live-map',
    description:
      'Realtime vehicle positions and prognosis data based on scheduled times, realtime updates and GPS locations.',
    img: liveTrackerMunichImg,
    extraFiles: {
      'assets/tralis-live-map/index.js': {
        content: `export default ${JSON.stringify(munichAssets)};`,
      },
    },
  },
  // These examples are used for the dbug of TralisLayer don't remove them pls.
  // {
  //   name: 'Tralis tracker with OpenLayers',
  //   key: 'ol-tralis',
  //   description: 'Show moving tramway in an OpenLayers map.',
  //   img: liveTrackerOLImg,
  // },
  // {
  //   name: 'Tralis tracker with Mapbox',
  //   key: 'mapbox-tralis',
  //   description: 'Show moving tramway in an Mapbox map.',
  //   img: liveTrackerOLImg,
  // },
  {
    name: 'Mapbox layer',
    key: 'ol-mapbox-layer',
    description: 'Display a Mapbox layer on an OpenLayers map.',
    img: mapboxImg,
  },
  {
    name: 'Mapbox Style layer',
    key: 'ol-mapbox-style-layer',
    description: 'Display a mapbox style layer on an OpenLayers map.',
    img: mapboxStyleImg,
  },
  {
    name: 'Querying objects',
    key: 'ol-query',
    description:
      'This example shows how to query objects in different kinds of layers.',
    img: queryObjectsImg,
  },
  {
    name: 'Copyrights with OpenLayers',
    key: 'ol-copyright',
    description:
      'This example shows how to use the CopyrightControl component.',
    img: olCopyrightImg,
  },
  {
    name: 'Copyrights with Mapbox',
    key: 'mb-copyright',
    description:
      'This example shows how to use the CopyrightControl component.',
    img: olCopyrightImg,
  },
  {
    name: 'Stop finder',
    key: 'ol-stop-finder',
    description: 'Use the StopsAPI for finding public transport stops.',
    img: stopsImg,
  },
  {
    name: 'Routing',
    key: 'routing-control',
    description:
      'Use the RoutingControl component to visualize routes on a map.',
    img: routingImg,
    files: {
      html: 'ol-routing.html',
      js: 'ol-routing.js',
    },
  },
];
