import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import Map from '../../map/ol/Map';
import Layer from '../../layers/ol/Layer';
import MapboxLayer from '../../layers/ol/MapboxLayer';
import MapboxStyleLayer from '../../layers/ol/MapboxStyleLayer';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'mapboxstyle',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  const url = 'https://maps.geops.io/styles/travic/style.json?key=5cc87b12d7c5370001c1d6551c10432b24d74f74bcd3b7d88a5b7eab';

  const layer = new MapboxLayer({
    url,
  });
  const withoutLabels = new MapboxStyleLayer({
    mapboxLayer: layer,
    visible: false,
    styleLayersFilter: ({ layout }) => (!!layout['text-field']),
  });

  const layer2 = new MapboxLayer({
    url,
  });
  const labels = new MapboxStyleLayer({
    mapboxLayer: layer2,
    visible: false,
    styleLayersFilter: ({ layout }) => (!layout['text-field']),  
  });

  const vectorLayer = new Layer({
    olLayer: new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature(new Polygon([[
            [-1e7, -1e7],
            [-1e7, 1e7],
            [1e7, 1e7],
            [1e7, -1e7],
            [-1e7, -1e7]],
          ])),
        ],
      }),
    }),
  });

  map.addLayer(layer);
  map.addLayer(withoutLabels);
  map.addLayer(vectorLayer);
  map.addLayer(layer2);
  map.addLayer(labels);
};
