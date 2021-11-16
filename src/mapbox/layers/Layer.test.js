import mapboxgl from 'mapbox-gl';
import { toLonLat } from 'ol/proj';
import Layer from './Layer';

let map;
let mapElement;

describe('Layer', () => {
  beforeEach(() => {
    mapElement = document.createElement('div');
    const { style } = mapElement;
    style.position = 'absolute';
    style.left = '0px';
    style.top = '0px';
    style.width = '400px';
    style.height = '400px';
    mapElement.setAttribute('id', 'map');
    document.body.appendChild(mapElement);
    map = new mapboxgl.Map({
      container: document.getElementById('map'),
      style: `path/to/style`,
      center: toLonLat([831634, 5933959]),
      zoom: 9,
    });
  });

  afterEach(() => {
    document.body.removeChild(mapElement);
  });

  test('should initialize.', () => {
    const layer = new Layer({ name: 'Layer' });
    expect(layer).toBeInstanceOf(Layer);
  });

  test('should be visible by default.', () => {
    const layer = new Layer({ name: 'Layer' });
    expect(layer.visible).toBe(true);
  });

  test('should be invisible if defined.', () => {
    const layer = new Layer({ name: 'Layer', visible: false });
    expect(layer.visible).toBe(false);
  });

  test('should be invisible if set.', () => {
    const layer = new Layer({ name: 'Layer' });
    layer.setVisible(false);
    expect(layer.visible).toBe(false);
  });

  test('should visibility stay unchanged', () => {
    const layer = new Layer({ name: 'Layer', visible: false });
    layer.setVisible(false);
    expect(layer.visible).toBe(false);
  });

  test('should return its name.', () => {
    const layer = new Layer({ name: 'Layer', visible: false });
    expect(layer.name).toEqual('Layer');
  });

  test('should call terminate on initialization.', () => {
    const layer = new Layer({ name: 'Layer' });
    const spy = jest.spyOn(layer, 'terminate');
    layer.init(map);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should clone', () => {
    const layer = new Layer({
      name: 'Layer',
      copyrights: ['bar'],
    });
    const clone = layer.clone({ name: 'clone' });
    expect(clone).not.toBe(layer);
    expect(clone.name).toBe('clone');
    expect(clone).toBeInstanceOf(Layer);
  });
});
