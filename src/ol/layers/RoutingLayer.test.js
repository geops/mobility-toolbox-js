import fetch from 'jest-fetch-mock';
import Map from 'ol/Map';
import View from 'ol/View';
import RoutingLayer from './RoutingLayer';

let layer;
let onClick;
let olMap;

describe('RoutingLayer', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    onClick = jest.fn();
    layer = new RoutingLayer({
      onClick,
      apiKey: 'apiKey',
    });

    olMap = new Map({
      view: new View({
        center: [831634, 5933959],
        zoom: 9,
      }),
    });
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(RoutingLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');

    fetch.mockResponseOnce(JSON.stringify(global.fetchTrajectoriesResponse));

    layer.init(olMap);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should clone', () => {
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(RoutingLayer);
  });
});
