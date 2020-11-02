import View from 'ol/View';
import Vectorlayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { StopsAPI } from '../../api';
import { Map, MapboxLayer } from '../../ol';
import 'ol/ol.css';

export default () => {
  const api = new StopsAPI({
    url: 'https://api.geops.io/stops/v1/',
    apiKey: window.apiKey,
  });

  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 8,
    }),
  });

  const mapboxLayer = new MapboxLayer({
    url: `https://maps.geops.io/styles/base_bright_v1/style.json?key=${window.apiKey}`,
  });

  const vectorSource = new VectorSource();
  const vectorLayer = new Vectorlayer({ source: vectorSource });

  map.addLayer(mapboxLayer);
  map.addLayer(vectorLayer);

  const input = document.getElementById('search');
  input.onkeyup = (evt) => {
    vectorSource.clear(true);

    api.search({ q: evt.target.value }).then((featureCollection) => {
      const features = new GeoJSON().readFeatures(featureCollection, {
        featureProjection: map.getView().getProjection(),
      });
      vectorSource.addFeatures(features);

      map.getView().fit(vectorSource.getExtent(), {
        padding: [50, 50, 50, 50],
      });
    });
  };
};
