import View from 'ol/View';
import { Map, MapboxLayer } from '../../ol';
import CopyrightControl from '../../ol/controls/Copyright';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    // mobilityControls: [customCopyrightControl],
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 15,
    }),
  });

  // define a custom copyright
  const customCopyrightControl = new CopyrightControl(map, {
    targetElement: document.getElementById('copyright'),
  });

  map.addMobilityControl(customCopyrightControl);

  const url = `https://maps.geops.io/styles/base_bright_v2/style.json?key=${window.apiKey}`;
  const mapboxLayer = new MapboxLayer({ url });

  map.addLayer(mapboxLayer);

  /*
  // later, you can remove the control
  map.removeMobilityControl(customCopyrightControl);
  */
};
