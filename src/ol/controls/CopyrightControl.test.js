import View from 'ol/View';
import Tile from 'ol/Tile';
import TileLayer from 'ol/layer/Tile';
import TileSource from 'ol/source/Tile';
import { createXYZ } from 'ol/tilegrid';
import { Map } from 'ol';
import CopyrightControl from './CopyrightControl';

const tileLoadFunction = () => {
  const tile = new Tile([0, 0, -1], 2 /* LOADED */);
  tile.getImage = () => {
    const image = new Image();
    image.width = 256;
    image.height = 256;
    return image;
  };
  return tile;
};

const getOLTileLayer = (options = {}) => {
  const layer = new TileLayer({
    ...options,
    source: new TileSource({
      projection: 'EPSG:3857',
      tileGrid: createXYZ(),
    }),
  });
  layer.getSource().getTile = tileLoadFunction;
  return layer;
};

const getLayer = (copyrights, visible = true) =>
  getOLTileLayer({
    visible,
    copyrights,
  });

describe('CopyrightControl', () => {
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
    map.addLayer(getLayer(true, 'bar'));
    map.setSize([200, 200]);
    map.renderSync();
  });

  afterEach(() => {
    if (map) {
      map.setTarget(null);
      map = null;
    }
  });

  test('should be activate by default', () => {
    const control = new CopyrightControl();
    expect(control.active).toBe(true);
  });

  test('renders a string copyright', () => {
    const control = new CopyrightControl();
    map.addControl(control);
    expect(control.element.innerHTML).toBe('');
    getLayer('copyright').attachToMap(map);
    map.renderSync();
    expect(control.element.innerHTML).toBe('copyright');
  });

  test('renders an array of copyrights', () => {
    const control = new CopyrightControl();
    map.addControl(control);
    expect(control.element.innerHTML).toBe('');
    map.addLayer(getLayer(['copyright 1', 'copyright 2']));
    map.renderSync();
    expect(control.element.innerHTML).toBe('copyright 1 | copyright 2');
  });

  test('renders unique copyrights', () => {
    const control = new CopyrightControl();
    map.addControl(control);
    expect(control.element.innerHTML).toBe('');
    map.addLayer(getLayer(['copyright 1', 'copyright 2']));
    map.addLayer(getLayer('copyright 1'));
    map.addLayer(getLayer(['copyright 2']));
    map.renderSync();
    expect(control.element.innerHTML).toBe('copyright 1 | copyright 2');
  });

  test("doesn't render copyright of an hidden layer", () => {
    const control = new CopyrightControl();
    map.addControl(control);
    expect(control.element.innerHTML).toBe('');
    const layer1 = getLayer('copyright hidden', false);
    map.addLayer(layer1);
    const layer2 = getLayer('copyright', true);
    map.addLayer(layer2);
    map.renderSync();
    expect(control.element.innerHTML).toBe('copyright');

    // the we update visibility of both layers
    layer1.visible = true;
    map.renderSync();
    layer2.visible = false;
    map.renderSync();
    expect(control.element.innerHTML).toBe('copyright hidden');
  });

  test('should activate the control on construction then deactivate it', () => {
    getLayer('copyright 1').attachToMap(map);
    const control = new CopyrightControl({ active: true });
    map.addControl(control);
    map.renderSync();

    expect(control.element.parentNode).toBe(map.getTargetElement());

    // Should be activated by default.
    expect(control.active).toBe(true);
    expect(control.element.innerHTML).toBe('copyright 1');

    // on deactivation
    control.active = false;
    map.renderSync();
    expect(control.element.innerHTML).toBe('');
  });

  test('should deactivate the control on constrcution then activate it', () => {
    map.addLayer(getLayer('copyright 1'));
    const control = new CopyrightControl({ active: false });
    map.addControl(control);
    map.renderSync();

    expect(control.element.parentNode).toBe(map.getTargetElement());

    // Should be activated by default.
    expect(control.active).toBe(false);
    map.renderSync();
    expect(control.element.innerHTML).toBe('');

    // on deactivation
    control.active = true;
    map.renderSync();
    expect(control.element.innerHTML).toBe('copyright 1');
  });

  test('should add copyrights in the map container element then remove it.', () => {
    map.addLayer(getLayer('copyright value'));
    map.renderSync();

    const control = new CopyrightControl();

    // Add control
    map.addControl(control);
    expect(control.element.parentNode).toBe(map.getTargetElement());

    // Remove control
    map.removeControl(control);
    expect(control.element.parentNode).toBe(null);
  });

  test.only('should add copyrights in the target element then remove it.', () => {
    map.addLayer(getLayer(['copyright value']));
    map.renderSync();

    const target = document.createElement('div');
    target.setAttribute('id', 'copyright');
    document.body.appendChild(target);

    const control = new CopyrightControl({
      target: document.getElementById('copyright'),
    });

    // Add control
    map.addControl(control);
    expect(control.element.parentNode).toBe(target);

    // Remove control
    map.removeControl(control);
    expect(control.element.parentNode).toBe(null);
  });

  test('renders custom copyrights with the render method ', () => {
    const control = new CopyrightControl({
      active: true,
      render() {
        if (!this.element) {
          return;
        }
        this.element.innerHTML = this.active
          ? this.getCopyrights().join(', ')
          : '';
      },
    });
    map.addControl(control);
    map.addLayer(getLayer(['copyright 1', 'copyright 2', 'copyright 3']));
    map.renderSync();

    // Add control
    expect(control.element.innerHTML).toBe(
      'copyright 1, copyright 2, copyright 3',
    );
  });
});
