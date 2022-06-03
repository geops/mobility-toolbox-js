import maplibre from 'maplibre-gl';
import fetch from 'jest-fetch-mock';
import { toLonLat } from 'ol/proj';
import TrajservLayer from './TrajservLayer';

let layer;
let onClick;

describe('TrajservLayer', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    onClick = jest.fn();
    layer = new TrajservLayer({
      apiKey: 'foo',
      onClick,
    });
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TrajservLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');

    fetch.mockResponseOnce(JSON.stringify(global.fetchTrajectoriesResponse));

    const mapElement = document.createElement('div');
    const { style } = mapElement;
    style.position = 'absolute';
    style.left = '0px';
    style.top = '0px';
    style.width = '400px';
    style.height = '400px';
    mapElement.setAttribute('id', 'map');
    document.body.appendChild(mapElement);

    layer.init(
      new maplibre.Map({
        container: document.getElementById('map'),
        style: `path/to/style`,
        center: toLonLat([831634, 5933959]),
        zoom: 9,
      }),
    );

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

  test('should create a default api with default url.', () => {
    expect(layer).toBeInstanceOf(TrajservLayer);
    expect(layer.api.url).toBe('https://api.geops.io/tracker/v1');
    expect(layer.api.apiKey).toBe('foo');
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
});
