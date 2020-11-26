import View from 'ol/View';
import { Map, MapboxLayer } from '../../ol';
import CopyrightControl from '../../ol/controls/Copyright';
import 'ol/ol.css';

export default () => {
  // Define a custom copyright
  const customCopyrightControl = new CopyrightControl({
    targetElement: document.getElementById('copyright'),
  });

  const map = new Map({
    target: 'map',
    mobilityControls: [customCopyrightControl],
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
  });

  const url = `https://maps.geops.io/styles/base_bright_v2/style.json?key=${window.apiKey}`;
  const mapboxLayer = new MapboxLayer({ url });

  map.addLayer(mapboxLayer);

  // Add example button to remove the copyright Control from the map.
  const buttonWrapper = document.getElementById('button');
  const button = document.createElement('button');
  button.innerHTML = 'Remove copyright';
  button.onclick = () => {
    map.removeMobilityControl(customCopyrightControl);
  };
  buttonWrapper.appendChild(button);
};
