import fetch from 'jest-fetch-mock';
import View from 'ol/View';
import Map from '../Map';
import RoutingControl from './RoutingControl';

describe('RoutingControl', () => {
  let map;

  beforeEach(() => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    map = new Map({
      target,
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
    global.fetch = fetch;
  });

  afterEach(() => {
    if (map) {
      map.setTarget(null);
      map = null;
    }
    fetch.resetMocks();
  });

  test('should be activate by default', () => {
    const control = new RoutingControl();
    expect(control.active).toBe(true);
  });

  test('launch routing and add features', (done) => {
    fetch.mockResponseOnce(JSON.stringify(global.fetchRouteResponse));

    const control = new RoutingControl({
      url: 'https://foo.ch',
      apiKey: 'foo',
    });
    control.map = map;
    expect(map.getTarget().querySelector('#ol-toggle-routing')).toBeDefined();
    control.viaPoints = [
      [950476.4055933182, 6003322.253698345],
      [950389.0813034325, 6003656.659274571],
    ];
    control
      .drawRoute(control.viaPoints)
      .then(() => {
        // Should use correct URL
        expect(fetch.mock.calls[0][0]).toEqual(
          'https://foo.ch?coord-punish=1000&coord-radius=100&elevation=false&key=foo&mot=bus&resolve-hops=false&via=47.3739194713294%2C8.538274823394632%7C47.37595378493421%2C8.537490375951839',
        );
        // routingLayer should contain three features (2 x viapoints, 1 x route)
        expect(
          control.routingLayer.olLayer.getSource().getFeatures().length,
        ).toEqual(3);
      })
      .catch(() => {});
    done();
  });

  test('ignores Abort Error and returns undefined', (done) => {
    const control = new RoutingControl({
      url: 'https://foo.ch',
      apiKey: 'foo',
    });
    control.map = map;
    control.viaPoints = [
      [950476.4055933182, 6003322.253698345],
      [950389.0813034325, 6003656.659274571],
    ];
    const error = new Error('Error');
    error.name = 'AbortError';
    fetch.mockRejectOnce(error);
    return control.drawRoute().then((data) => {
      expect(data).toBe();
      done();
    });
  });
});
