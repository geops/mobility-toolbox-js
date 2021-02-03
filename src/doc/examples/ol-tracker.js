import View from 'ol/View';

import Feature from 'ol/Feature';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

import { Polygon } from 'ol/geom';
import { Map, TrajservLayer, MapboxLayer } from '../../ol';
import 'ol/ol.css';
import CopyrightControl from '../../ol/controls/CopyrightControl';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 13,
    }),
    controls: [new CopyrightControl()],
  });

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/base_bright_v2/style.json',
    apiKey: window.apiKey,
  });

  const swissPolygon = new Polygon([
    [
      [1200512.3, 5740863.4],
      [1200512.3, 6077033.16],
      [656409.5, 6077033.16],
      [656409.5, 5740863.4],
      [1200512.3, 5740863.4],
    ],
  ]);

  const tracker = new TrajservLayer({
    url: 'https://api.geops.io/tracker/v1',
    apiKey: window.apiKey,
    filterFunc: (f) => {
      const { geometry, publisher } = f;
      if (
        swissPolygon.intersectsCoordinate(geometry.getFirstCoordinate()) ||
        swissPolygon.intersectsCoordinate(geometry.getLastCoordinate())
      ) {
        return publisher === 'SBB';
      }
      return true;
    },
  });

  tracker.onClick((vehicle) => {
    // eslint-disable-next-line no-console
    console.log(vehicle);
  });

  const poly = new Feature({
    geometry: swissPolygon,
  });

  const vectorSource1 = new Vector({
    features: [poly],
  });

  const vectorLayer1 = new VectorLayer({
    source: vectorSource1,
  });

  map.addLayer(layer);
  map.addLayer(tracker);

  map.addLayer(vectorLayer1);
};
