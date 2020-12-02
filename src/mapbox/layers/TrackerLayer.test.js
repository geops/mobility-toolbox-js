import mapboxgl from 'mapbox-gl/dist/mapbox-gl-unminified';
import { toLonLat } from 'ol/proj';
import TrackerLayer from './TrackerLayer';

let layer;
let onClick;

describe('TrackerLayer', () => {
  beforeEach(() => {
    onClick = jest.fn();
    layer = new TrackerLayer({
      onClick,
    });
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TrackerLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');

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
      new mapboxgl.Map({
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
});
