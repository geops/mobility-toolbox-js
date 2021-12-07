import fetch from 'jest-fetch-mock';
import Map from 'ol/Map';
import View from 'ol/View';
import TrajservLayer from './TrajservLayer';

let layer;
let onClick;
let olMap;

describe('TrajservLayer', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    onClick = jest.fn();
    layer = new TrajservLayer({
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

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TrajservLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');

    fetch.mockResponseOnce(JSON.stringify(global.fetchTrajectoriesResponse));

    layer.init(olMap);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('#onClick', () => {
    const f = () => {};
    layer.onClick(f);
    expect(layer.clickCallbacks[1]).toBe(f);
    expect(layer.clickCallbacks.length).toBe(2);
    layer.onClick(f);
    expect(layer.clickCallbacks.length).toBe(2);
  });

  test('#unClick', () => {
    const foo = () => {};
    const bar = () => {};
    layer.onClick(foo);
    layer.onClick(bar);
    expect(layer.clickCallbacks[1]).toBe(foo);
    expect(layer.clickCallbacks[2]).toBe(bar);
    expect(layer.clickCallbacks.length).toBe(3);
    layer.unClick(foo);
    expect(layer.clickCallbacks[1]).toBe(bar);
    expect(layer.clickCallbacks.length).toBe(2);
  });

  test("map events should be called if zoom doesn't change", () => {
    const spy2 = jest.spyOn(layer, 'onMoveEnd');

    // Mock response for the following calls
    fetch.mockResponse(JSON.stringify(global.fetchTrajectoriesResponse));

    // init uses mockResponse
    layer.init(olMap);

    // Start uses mockResponse
    layer.start();

    // dispatchEvent uses mockResponse
    const evt2 = { type: 'moveend', olMap };
    olMap.dispatchEvent(evt2);
    expect(spy2).toHaveBeenCalledTimes(2);
    olMap.dispatchEvent(evt2);
    expect(spy2).toHaveBeenCalledTimes(4);
  });

  test('should create a default api with default url.', () => {
    expect(layer).toBeInstanceOf(TrajservLayer);
    expect(layer.api.url).toBe('https://api.geops.io/tracker/v1');
    expect(layer.api.apiKey).toBe('apiKey');
  });

  test('should create an api with custom url and apiKey.', () => {
    const layr = new TrajservLayer({
      url: 'https:foo.ch',
      apiKey: 'bar',
    });
    expect(layr).toBeInstanceOf(TrajservLayer);
    expect(layr.api.url).toBe('https:foo.ch');
    expect(layr.api.apiKey).toBe('bar');
  });

  test('should clone', () => {
    const layr = new TrajservLayer({
      name: 'test',
      url: 'https:foo.ch',
      apiKey: 'bar',
    });
    const clone = layr.clone({ name: 'clone' });
    expect(layr.name).toBe('test');
    expect(clone).not.toBe(layr);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(TrajservLayer);
  });
});
