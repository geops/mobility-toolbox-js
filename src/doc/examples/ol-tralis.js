import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { Map, TralisLayer, MapboxLayer } from '../../ol';
import 'ol/ol.css';
import CopyrightControl from '../../ol/controls/CopyrightControl';
import { trackerStyle } from '../../common/utils';
// import LINE_IMAGES from './assets/tralis-live-map';

// const min = [1254752.0378, 6115573.759];
// const max = [1321443.345, 6148938.5219];

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      // center: max,
      center: [831634, 5933959],
      // center: fromLonLat([7.841148, 47.996542]), // freiburg
      // center: fromLonLat([11.55, 48.14]), // munich
      zoom: 11,
    }),
    controls: [new CopyrightControl()],
  });

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });

  const tracker = new TralisLayer({
    url: 'wss://tralis-tracker-api.geops.io/ws',
    apiKey: window.apiKey,
    // bbox: [1152072, 6048052, 1433666, 6205578],
    isUpdateBboxOnMoveEnd: true,
    style: (obj, viewState) => {
      return trackerStyle(obj, viewState, tracker);
    },
  });

  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });

  map.addLayer(layer);
  map.addLayer(tracker);
};
