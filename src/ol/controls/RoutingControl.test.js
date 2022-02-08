import fetch from 'jest-fetch-mock';
import View from 'ol/View';
import Map from '../Map';
import RoutingControl from './RoutingControl';

import RoutingControlStation1 from './snapshots/RoutingControlStation1.json';
import RoutingControlStation2 from './snapshots/RoutingControlStation2.json';
import RoutingControlRouteGen5 from './snapshots/RoutingControlRouteGen5.json';
import RoutingControlRouteGen10 from './snapshots/RoutingControlRouteGen10.json';
import RoutingControlRouteGen30 from './snapshots/RoutingControlRouteGen30.json';
import RoutingControlRouteGen100 from './snapshots/RoutingControlRouteGen100.json';
import RoutingControlRouteOSM from './snapshots/RoutingControlRouteOSM.json';

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
          'https://foo.ch?coord-punish=1000&coord-radius=100&elevation=false&graph=osm&key=foo&mot=bus&resolve-hops=false&via=47.3739194713294%2C8.538274823394632%7C47.37595378493421%2C8.537490375951839',
        );
        // routingLayer should contain three features (2 x viapoints, 1 x route)
        expect(
          control.routingLayer.olLayer.getSource().getFeatures().length,
        ).toEqual(3);
        done();
      })
      .catch(() => {});
  });

  test('launch routing and add features for multiple graphs', (done) => {
    fetch.mockResponses(
      [JSON.stringify(RoutingControlStation1), { status: 200 }],
      [JSON.stringify(RoutingControlStation2), { status: 200 }],
      [JSON.stringify(RoutingControlRouteGen5), { status: 200 }],
      [JSON.stringify(RoutingControlRouteGen10), { status: 200 }],
      [JSON.stringify(RoutingControlRouteGen30), { status: 200 }],
      [JSON.stringify(RoutingControlRouteGen100), { status: 200 }],
      [JSON.stringify(RoutingControlRouteOSM), { status: 200 }],
    );

    const control = new RoutingControl({
      url: 'https://foo.ch/',
      stopsApiUrl: 'https://foo.ch/',
      apiKey: 'foo',
      graphs: [
        ['gen5', 6, 7],
        ['gen10', 8],
        ['gen30', 9, 10],
        ['gen100', 11, 13],
        ['osm', 14, 99],
      ],
    });
    control.map = map;
    control.viaPoints = ['a4dca961d199ff76', 'e3666f03cba06b2b'];
    control
      .drawRoute(control.viaPoints)
      .then(() => {
        // Should use correct URL
        expect(fetch.mock.calls[0][0]).toEqual(
          'https://foo.ch/lookup/a4dca961d199ff76?key=foo',
        );
        expect(fetch.mock.calls[1][0]).toEqual(
          'https://foo.ch/lookup/e3666f03cba06b2b?key=foo',
        );
        expect(fetch.mock.calls[2][0]).toEqual(
          'https://foo.ch/?coord-punish=1000&coord-radius=100&elevation=false&graph=gen5&key=foo&mot=bus&resolve-hops=false&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b',
        );
        expect(fetch.mock.calls[3][0]).toEqual(
          'https://foo.ch/?coord-punish=1000&coord-radius=100&elevation=false&graph=gen10&key=foo&mot=bus&resolve-hops=false&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b',
        );
        expect(fetch.mock.calls[4][0]).toEqual(
          'https://foo.ch/?coord-punish=1000&coord-radius=100&elevation=false&graph=gen30&key=foo&mot=bus&resolve-hops=false&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b',
        );
        expect(fetch.mock.calls[5][0]).toEqual(
          'https://foo.ch/?coord-punish=1000&coord-radius=100&elevation=false&graph=gen100&key=foo&mot=bus&resolve-hops=false&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b',
        );
        expect(fetch.mock.calls[6][0]).toEqual(
          'https://foo.ch/?coord-punish=1000&coord-radius=100&elevation=false&graph=osm&key=foo&mot=bus&resolve-hops=false&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b',
        );
        // routingLayer should contain seven features (2 x viapoints, 5 x route for each graph)
        expect(
          control.routingLayer.olLayer.getSource().getFeatures().length,
        ).toEqual(7);
        done();
      })
      .catch(() => {});
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
      expect(data).toEqual([undefined]);
      done();
    });
  });
});
