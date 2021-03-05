import { Map, TralisLayer } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  const lineColors = {
    S1: '#00b6e2',
    S2: '#6db037',
    S3: '#8d1873',
    S4: '#e4001b',
    S6: '#239368',
    S7: '#812621',
    S8: '#000000',
    S20: '#e64c68',
  };

  const map = new Map({
    container: 'map',
    style: 'https://maps.geops.io/styles/travic/style.json',
    apiKey: window.apiKey,
    center: [11.55, 48.14],
    zoom: 10,
    touchPitch: false,
    pitchWithRotate: false,
    dragRotate: false,
    touchZoomRotate: false,
  });

  const imageCache = {};

  const getLineImage = (props) => {
    const lineName = (props.line || {}).name || '?';
    if (!imageCache[lineName]) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const textWidth = ctx.measureText(lineName).width;
      canvas.width = 30;
      canvas.height = 30;

      // draw circle
      ctx.beginPath();
      ctx.arc(15, 15, 13, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = lineColors[lineName];
      ctx.fillStyle = lineColors[lineName];
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.fill();

      // add text
      ctx.font = '14px Arial';
      ctx.fillStyle = lineName === 'S8' ? '#f2b42c' : 'white';
      ctx.globalAlpha = 1;
      ctx.fillText(lineName, 12 - textWidth / 2, 20);

      imageCache[lineName] = new Image();
      imageCache[lineName].src = canvas.toDataURL();
    }
    return imageCache[lineName];
  };

  const tracker = new TralisLayer({
    url: 'wss://api.geops.io/realtime-ws/v1/',
    apiKey: window.apiKey,
    style: getLineImage,
  });

  map.addLayer(tracker);
};
