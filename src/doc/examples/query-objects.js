import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import View from 'ol/View';
import { Map, MapboxLayer, MapboxStyleLayer, VectorLayer } from '../../ol';
import 'ol/ol.css';

export default () => {
  const addText = (text) => {
    const element = document.getElementById('content');
    element.innerHTML = text;
  };

  const onClick = (features) => {
    if (features.length) {
      addText(features[0].get('name'));
    }
  };

  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
  });

  const mapboxLayer = new MapboxLayer({
    url: `https://maps.geops.io/styles/base_bright_v1/style.json?key=${window.apiKey}`,
  });

  const poiLayer = new MapboxStyleLayer({
    name: 'poi layer',
    visible: true,
    mapboxLayer,
    styleLayer: {
      id: 'poi_with_icons-lvl',
    },
    onClick,
  });

  const vectorLayer = new VectorLayer({
    olLayer: new OLVectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            name: 'Rectangle',
            geometry: new Polygon([
              [
                [950693, 6003968],
                [950693, 6003936],
                [950760, 6003936],
                [950760, 6003968],
                [950693, 6003968],
              ],
            ]),
          }),
        ],
      }),
    }),
    onClick,
  });

  map.addLayer(mapboxLayer);
  map.addLayer(poiLayer);
  map.addLayer(vectorLayer);
};
