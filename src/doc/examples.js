import simpleMapImg from './img/examples/simple_map.jpg';
import liveTrackerOLImg from './img/examples/live_tracker_ol.jpg';
import liveTrackerMBImg from './img/examples/live_tracker_mb.jpg';
import mapboxImg from './img/examples/mapbox.jpg';
import mapboxStyleImg from './img/examples/mapbox_style.jpg';

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
    description: 'Show moving trains in a OpenLayers map.',
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
];
