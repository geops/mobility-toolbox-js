// To make redirect works properly on netlify it's important that the key
// are differents from the name of js and html files.
export default [
  {
    name: 'Simple map',
    key: 'ol-map',
    description: 'A simple map example.',
    files: {
      html: 'map.html',
      js: 'map.js',
    },
  },
  {
    name: 'Live tracker with OpenLayers',
    key: 'ol-tracker',
    description: 'Show moving trains in a OpenLayers map.',
    files: {
      html: 'tracker.html',
      js: 'tracker.js',
    },
  },
  {
    name: 'Live tracker with Mapbox',
    key: 'mapbox-tracker',
    description: 'Show moving trains in a Mapbox map.',
    files: {
      html: 'mapboxtracker.html',
      js: 'mapboxtracker.js',
    },
  },
  {
    name: 'Mapbox layer',
    key: 'mapbox-layer',
    description: 'Display a Mapbox layer on an OpenLayers map.',
    files: {
      html: 'mapbox.html',
      js: 'mapbox.js',
    },
  },
  {
    name: 'Mapbox Style layer',
    key: 'mapbox-style-layer',
    description: 'Display a mapbox style layer on an OpenLayers map.',
    files: {
      html: 'mapboxstyle.html',
      js: 'mapboxstyle.js',
    },
  },
];
