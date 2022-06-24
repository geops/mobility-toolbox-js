import fetch from 'jest-fetch-mock';
import Map from 'ol/Map';
import View from 'ol/View';
import WS from 'jest-websocket-mock';
import TralisLayer from './TralisLayer';

// create a WS instance, listening on port 1234 on localhost
let layer;
let onClick;
let olMap;
let server;

describe('TralisLayer', () => {
  beforeEach(() => {
    server = new WS('ws://localhost:1234');
    global.fetch = fetch;
    fetch.resetMocks();

    onClick = jest.fn();
    layer = new TralisLayer({
      url: 'ws://localhost:1234',
      apiKey: 'apiKey',
      onClick,
    });

    olMap = new Map({
      view: new View({
        center: [831634, 5933959],
        zoom: 9,
      }),
    });
  });

  afterEach(() => {
    // ...or gracefully close the connection
    server.close();

    // The WS class also has a static "clean" method to gracefully close all open connections,
    // particularly useful to reset the environment between test runs.
    WS.clean();
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TralisLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'detachFromMap');

    fetch.mockResponseOnce(JSON.stringify(global.fetchTrajectoriesResponse));

    layer.attachToMap(olMap);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should clone', () => {
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(TralisLayer);
  });

  test('should use the sort function.', () => {
    const fn = () => true;
    const laye = new TralisLayer({
      url: 'ws://localhost:1234',
      apiKey: 'apiKey',
      sort: fn,
    });
    expect(laye).toBeInstanceOf(TralisLayer);
    expect(laye.sort).toBe(fn);
  });

  test('should use filter function.', () => {
    const fn = () => true;
    const laye = new TralisLayer({
      url: 'ws://localhost:1234',
      apiKey: 'apiKey',
      filter: fn, // reverse the array
    });
    expect(laye).toBeInstanceOf(TralisLayer);
    expect(laye.filter).toBe(fn);
  });

  test('should override filter function if operator, tripNumber, regexPublishedLineName is set.', () => {
    const fn = () => true;
    const laye = new TralisLayer({
      url: 'ws://localhost:1234',
      apiKey: 'apiKey',
      filter: fn, // reverse the array
      publishedLineName: '.*',
    });
    expect(laye).toBeInstanceOf(TralisLayer);
    expect(laye.filter).not.toBe(fn);
  });
});
