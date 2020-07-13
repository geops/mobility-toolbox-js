import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import View from 'ol/View';
import { Map, MapboxLayer, MapboxStyleLayer, VectorLayer } from '../../ol';
import 'ol/ol.css';

export default () => {
  const addText = (text) => {
    const element = document.getElementById('box');
    element.innerHTML = text;
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
      id: 'poi_with_icons',
    },
  });

  map.on('singleclick', (e) => {
    poiLayer.getFeatureInfoAtCoordinate(e.coordinate).then((d) => {
      if (d.features.length) {
        addText(d.features[0].get('name'));
      }
    });
  });

  const vectorLayer = new VectorLayer({
    olLayer: new OLVectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            name: 'reactangle',
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
  });

  vectorLayer.onClick((features) => {
    if (features.length) {
      addText(features[0].get('name'));
    }
  });

  map.addLayer(mapboxLayer);
  map.addLayer(poiLayer);
  map.addLayer(vectorLayer);
};
