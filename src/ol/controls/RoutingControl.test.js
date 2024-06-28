import fetch from 'jest-fetch-mock';
import View from 'ol/View';
import Map from 'ol/Map';
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
    expect(control.snapToClosestStation).toBe(false);
    expect(control.useRawViaPoints).toBe(false);
  });

  test('launch routing and add features', (done) => {
    fetch.mockResponseOnce(JSON.stringify(global.fetchRouteResponse));

    const control = new RoutingControl({
      url: 'https://foo.ch',
      apiKey: 'foo',
    });
    map.addControl(control);
    expect(
      map.getTargetElement().querySelector('#ol-toggle-routing'),
    ).toBeDefined();
    control.viaPoints = [
      [950476.4055933182, 6003322.253698345],
      [950389.0813034325, 6003656.659274571],
    ];
    control.drawRoute(control.viaPoints).then(() => {
      // Should use correct URL
      expect(fetch.mock.calls[0][0]).toEqual(
        'https://foo.ch/?key=foo&graph=osm&via=47.3739194713294%2C8.538274823394632%7C47.37595378493421%2C8.537490375951839&mot=bus&resolve-hops=false&elevation=false&coord-radius=100&coord-punish=1000',
      );
      // routingLayer should contain three features (2 x viapoints, 1 x route)
      expect(control.routingLayer.getSource().getFeatures().length).toEqual(3);
      done();
    });
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
    map.addControl(control);
    control.viaPoints = ['a4dca961d199ff76', 'e3666f03cba06b2b'];
    control.drawRoute(control.viaPoints).then(() => {
      // Should use correct URL
      expect(fetch.mock.calls[0][0]).toEqual(
        'https://foo.ch/lookup/a4dca961d199ff76?key=foo',
      );
      expect(fetch.mock.calls[1][0]).toEqual(
        'https://foo.ch/lookup/e3666f03cba06b2b?key=foo',
      );
      expect(fetch.mock.calls[2][0]).toEqual(
        'https://foo.ch/?key=foo&graph=gen5&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b&mot=bus&resolve-hops=false&elevation=false&coord-radius=100&coord-punish=1000',
      );
      expect(fetch.mock.calls[3][0]).toEqual(
        'https://foo.ch/?key=foo&graph=gen10&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b&mot=bus&resolve-hops=false&elevation=false&coord-radius=100&coord-punish=1000',
      );
      expect(fetch.mock.calls[4][0]).toEqual(
        'https://foo.ch/?key=foo&graph=gen30&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b&mot=bus&resolve-hops=false&elevation=false&coord-radius=100&coord-punish=1000',
      );
      expect(fetch.mock.calls[5][0]).toEqual(
        'https://foo.ch/?key=foo&graph=gen100&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b&mot=bus&resolve-hops=false&elevation=false&coord-radius=100&coord-punish=1000',
      );
      expect(fetch.mock.calls[6][0]).toEqual(
        'https://foo.ch/?key=foo&graph=osm&via=%21a4dca961d199ff76%7C%21e3666f03cba06b2b&mot=bus&resolve-hops=false&elevation=false&coord-radius=100&coord-punish=1000',
      );
      // routingLayer should contain seven features (2 x viapoints, 5 x route for each graph)
      expect(control.routingLayer.getSource().getFeatures().length).toEqual(7);
      done();
    });
  });

  test('ignores Abort Error and returns undefined', (done) => {
    const control = new RoutingControl({
      url: 'https://foo.ch',
      apiKey: 'foo',
    });
    map.addControl(control);
    control.viaPoints = [
      [950476.4055933182, 6003322.253698345],
      [950389.0813034325, 6003656.659274571],
    ];
    const error = new Error('Error');
    error.name = 'AbortError';
    fetch.mockRejectOnce(error);
    control.drawRoute().then((data) => {
      expect(data).toEqual([undefined]);
      done();
    });
  });

  test('calls routing api with @ before the coordinates when snapToClosestStation is true', (done) => {
    fetch.mockResponses(
      [JSON.stringify(RoutingControlStation1), { status: 200 }],
      [JSON.stringify(global.fetchRouteResponse), { status: 200 }],
    );

    const control = new RoutingControl({
      apiKey: 'foo',
      snapToClosestStation: true,
    });
    map.addControl(control);
    expect(map.getTarget().querySelector('#ol-toggle-routing')).toBeDefined();
    control.viaPoints = [
      [950476.4055933182, 6003322.253698345],
      [950389.0813034325, 6003656.659274571],
      'e3666f03cba06b2b',
    ];
    control.drawRoute(control.viaPoints).then(() => {
      const { searchParams } = new URL(fetch.mock.calls[1][0]);
      expect(searchParams.get('via')).toBe(
        '@47.3739194713294,8.538274823394632|@47.37595378493421,8.537490375951839|!e3666f03cba06b2b',
      );
      done();
    });
  });

  test('calls routing api with raw via points', (done) => {
    fetch.mockResponses(
      [JSON.stringify(RoutingControlStation1), { status: 200 }],
      [JSON.stringify(RoutingControlStation2), { status: 200 }],
      [JSON.stringify(global.fetchRouteResponse), { status: 200 }],
    );

    const control = new RoutingControl({
      apiKey: 'foo',
      useRawViaPoints: true,
    });
    map.addControl(control);
    expect(map.getTarget().querySelector('#ol-toggle-routing')).toBeDefined();
    control.viaPoints = [
      '46.2,7.1',
      '@46.2,7.1',
      '@46.2,7$1',
      'station name$2', // will send a stops request fo the station name
      'station name@46.2,7', // will use the coordinate
      'stationname@46.2,7.7$3', // will use the coordinate
      '!stationid', // will send a stops lookup request fo the station id
      [950389, 6003656],
    ];
    control.drawRoute(control.viaPoints).then(() => {
      const params = new URL(fetch.mock.calls[2][0]).searchParams;
      expect(params.get('via')).toBe(
        '46.2,7.1|@46.2,7.1|@46.2,7$1|station name$2|station name@46.2,7|stationname@46.2,7.7$3|!stationid|47.375949774398805,8.537489645590679',
      );
      done();
    });
  });
});
