import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import View from 'ol/View';
import Map from 'ol/Map';
import {
  MaplibreLayer,
  MapboxStyleLayer,
  VectorLayer,
  CopyrightControl,
} from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [950690.34, 6003962.67],
      zoom: 20,
    }),
    controls: [],
  });

  // Add copyright control
  const control = new CopyrightControl();
  map.addControl(copyright);

  map.on('pointermove', () => {
    map.getTargetElement().style.cursor = '';
  });

  const onHover = ([feature]) => {
    if (feature) {
      map.getTargetElement().style.cursor = 'pointer';
    }
  };

  const onClick = ([feature]) => {
    if (feature) {
      document.getElementById('content').innerHTML = feature.get('name');
    }
  };

  const mapboxLayer = new MaplibreLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  mapboxLayer.attachToMap(map);

  const poiLayer = new MapboxStyleLayer({
    visible: true,
    mapboxLayer,
    styleLayersFilter: ({ id }) => /^poi_named/.test(id),
    onHover,
    onClick,
  });
  poiLayer.attachToMap(map);

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
    onHover,
    onClick,
  });
  vectorLayer.attachToMap(map);
};
