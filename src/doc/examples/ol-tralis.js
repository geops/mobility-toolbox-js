import View from 'ol/View';
import Map from 'ol/Map';
import { TralisLayer, MapboxLayer, CopyrightControl } from '../../ol';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      // center: max,
      center: [831634, 5933959],
      zoom: 13,
      // center: fromLonLat([7.841148, 47.996542]), // freiburg
      // center: fromLonLat([11.55, 48.14]), // munich
    }),
    controls: [],
  });

  const control = new CopyrightControl();
  control.map = map;

  const layer = new MapboxLayer({
    url: 'https://maps.geops.io/styles/travic_v2/style.json',
    apiKey: window.apiKey,
  });
  layer.init(map);

  const tracker = new TralisLayer({
    url: 'wss://tralis-tracker-api.geops.io/ws',
    apiKey: window.apiKey,
    // bbox: [1152072, 6048052, 1433666, 6205578],
    isUpdateBboxOnMoveEnd: true,
    visible: true,
    tenant: 'sbb',
    // projection: 'EPSG:3857',
    // regexPublishedLineName: '^(S|R$|RE|PE|D|IRE|RB|TER)',
  });
  tracker.init(map);
  tracker.onClick(([feature]) => {
    if (feature) {
      // eslint-disable-next-line no-console
      console.log(feature.getProperties());
    }
  });
  document.getElementById('button').onclick = () => {
    tracker.setVisible(!tracker.visible);
  };
  document.getElementById('close').onclick = () => {
    tracker.api.conn.websocket.close();
    window.lastWs = tracker.api.conn.websocket;
  };
  document.getElementById('bbox').onclick = () => {
    tracker.api.conn.websocket.send(`BBOX ${tracker.api.bbox.join(' ')}`);
  };
  document.getElementById('terminate').onclick = () => {
    tracker.api.conn.websocket.terminate();
  };
};
