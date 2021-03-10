import { Map, CopyrightControl } from '../../mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default () => {
  // Define a custom copyright
  const control = new CopyrightControl({
    target: document.getElementById('copyright'),
    element: document.createElement('div'),
    render() {
      this.element.innerHTML = this.active
        ? this.getCopyrights().join(' | ')
        : '';
    },
  });

  const map = new Map({
    container: 'map',
    style: 'https://maps.geops.io/styles/travic_v2_generalized/style.json',
    apiKey: window.apiKey,
    center: [7.47, 46.95],
    zoom: 12,
    touchPitch: false,
    pitchWithRotate: false,
    dragRotate: false,
    touchZoomRotate: false,
    attributionControl: false,
    controls: [control],
  });

  // Add example button to toggle the copyright control.
  document.getElementById('button').addEventListener('click', () => {
    if (control.element.parentNode) {
      map.removeControl(control);
    } else {
      map.addControl(control);
    }
  });
};
