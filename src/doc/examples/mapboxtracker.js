import { Map } from 'mapbox-gl/dist/mapbox-gl-unminified';
import { toLonLat } from 'ol/proj';
import { TrajservLayer } from '../../mapbox';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    container: 'map',
    style: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
    center: toLonLat([831634, 5933959]),
    zoom: 9,
    fadeDuration: 0,
  });

  const tracker = new TrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: '5cc87b12d7c5370001c1d6556afe39038efb48709f6b5af1adf48bce',
  });

  const getCoordinates = () => {
    const bounds = map.getBounds().toArray();
    return [
      [bounds[0][0], bounds[1][1]],
      [...bounds[1]],
      [bounds[1][0], bounds[0][1]],
      [...bounds[0]],
    ];
  };

  window.map = map;

  map.on('load', () => {
    tracker.init(map);

    map.addSource('canvas-source', {
      type: 'canvas',
      canvas: tracker.tracker.canvas,
      coordinates: getCoordinates(),
      // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
      animate: true,
    });
    map.addLayer(
      {
        id: 'canvas-layer',
        type: 'raster',
        source: 'canvas-source',
        paint: {
          'raster-opacity': 1,
          'raster-fade-duration': 0,
        },
      },
      'waterway-name',
    );

    map.on('movestart', () => {
      // map.getSource('canvas-source').pause();
    });

    map.on('moveend', () => {
      // map.getSource('canvas-source').pause();
      // window.setTimeout(() => {
      map.getSource('canvas-source').setCoordinates(getCoordinates());
      // }, 300);
      // map.getSource('canvas-source').play();
      // document.body.appendChild(map.getSource('canvas-source').getCanvas());
    });

    map.on('moveend', () => {
      // map.getSource('canvas-source').play();
    });
  });
};
