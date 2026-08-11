import View from "ol/View";
import Map from "ol/Map";
import { MapsetLayer, MaplibreLayer } from "mobility-toolbox-js/ol";
import "ol/ol.css";

export default () => {
  const baseLayer = new MaplibreLayer({
    apiKey: window.apiKey,
  });

  const mapsetLayer = new MapsetLayer({
    apiKey: window.apiKey,
  });

  const map = new Map({
    layers: [baseLayer, mapsetLayer],
    target: "map",
    view: new View({
      center: [1099009.504901903, 5916622.273489362],
      zoom: 15.3,
    }),
  });
};
