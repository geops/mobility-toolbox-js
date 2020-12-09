import simpleMapImg from './img/examples/simple_map.jpg';
import liveTrackerOLImg from './img/examples/live_tracker_ol.jpg';
import liveTrackerMBImg from './img/examples/live_tracker_mb.jpg';
import mapboxImg from './img/examples/mapbox.jpg';
import mapboxStyleImg from './img/examples/mapbox_style.jpg';
import queryObjectsImg from './img/examples/query_objects.jpg';
import olCopyrightImg from './img/examples/ol-copyright.png';
import stopsImg from './img/examples/stops.jpg';

// To make redirect works properly on netlify it's important that the key
// are differents from the name of js and html files.
export default [
  {
    name: 'Simple map',
    key: 'ol-map',
    description: 'A simple map example.',
    img: simpleMapImg,
    files: {
      html: 'map.html',
      js: 'map.js',
    },
  },
  {
    name: 'Live tracker with OpenLayers',
    key: 'ol-tracker',
    description: 'Show moving trains in an OpenLayers map.',
    img: liveTrackerOLImg,
    files: {
      html: 'tracker.html',
      js: 'tracker.js',
    },
  },
  {
    name: 'Live tracker with Mapbox',
    key: 'mapbox-tracker',
    description: 'Show moving trains in a Mapbox map.',
    img: liveTrackerMBImg,
    files: {
      html: 'mapboxtracker.html',
      js: 'mapboxtracker.js',
    },
  },
  // These examples are used for the dbug of TralisLayer don't remove them pls.
  // {
  //   name: 'Tralis tracker with OpenLayers',
  //   key: 'ol-tralis',
  //   description: 'Show moving tramway in an OpenLayers map.',
  //   img: liveTrackerOLImg,
  //   files: {
  //     html: 'tralis.html',
  //     js: 'tralis.js',
  //   },
  // },
  // {
  //   name: 'Tralis tracker with Mapbox',
  //   key: 'mapbox-tralis',
  //   description: 'Show moving tramway in an Mapbox map.',
  //   img: liveTrackerOLImg,
  //   files: {
  //     html: 'mapboxtralis.html',
  //     js: 'mapboxtralis.js',
  //   },
  // },
  {
    name: 'Mapbox layer',
    key: 'mapbox-layer',
    description: 'Display a Mapbox layer on an OpenLayers map.',
    img: mapboxImg,
    files: {
      html: 'mapbox.html',
      js: 'mapbox.js',
    },
  },
  {
    name: 'Mapbox Style layer',
    key: 'mapbox-style-layer',
    description: 'Display a mapbox style layer on an OpenLayers map.',
    img: mapboxStyleImg,
    files: {
      html: 'mapboxstyle.html',
      js: 'mapboxstyle.js',
    },
  },
  {
    name: 'Querying objects',
    key: 'query-objects',
    description:
      'This example shows how to query objects in different kinds of layers.',
    img: queryObjectsImg,
    files: {
      html: 'query-objects.html',
      js: 'query-objects.js',
    },
  },
  {
    name: 'Copyrights with OpenLayers',
    key: 'ol-copyright',
    description:
      'This example shows how to use the CopyrightControl component.',
    img: olCopyrightImg,
    files: {
      html: 'ol-copyright.html',
      js: 'ol-copyright.js',
    },
  },
  {
    name: 'Copyrights with Mapbox',
    key: 'mb-copyright',
    description:
      'This example shows how to use the CopyrightControl component.',
    img: olCopyrightImg,
    files: {
      html: 'mb-copyright.html',
      js: 'mb-copyright.js',
    },
  },
  {
    name: 'Stops finder',
    key: 'ol-stops-finder',
    description: 'Use the StopsAPI for finding public transport stops.',
    img: stopsImg,
    files: {
      html: 'ol-stops-finder.html',
      js: 'ol-stops-finder.js',
    },
  },
];
