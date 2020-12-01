import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Map from '../Map';
import Layer from '../layers/Layer';
import CopyrightControl from './CopyrightControl';

const olLayer = new VectorLayer({ source: new VectorSource() });

describe('Copyright', () => {
  let map;

  afterEach(() => {
    if (map) {
      map.disposeInternal();
    }
  });

  describe('CopyrightControl', () => {
    test('should activate the control on constrcution then deactivate it', () => {
      map = new Map({
        target: document.body,
        layers: [
          new Layer({
            copyrights: ['copyright 1'],
            olLayer,
          }),
        ],
      });

      const control = new CopyrightControl({ active: true });

      control.map = map;
      expect(control.element.parentNode).toBe(map.getContainer());

      // Should be activated by default.
      expect(control.active).toBe(true);
      expect(control.element.innerHTML).toBe('copyright 1');

      // on deactivation
      control.active = false;
      expect(control.element.innerHTML).toBe('');
    });

    test('should deactivate the control on constrcution then activate it', () => {
      map = new Map({
        target: document.body,
        layers: [
          new Layer({
            copyrights: ['copyright 1'],
            olLayer,
          }),
        ],
      });

      const control = new CopyrightControl({ active: false });
      control.map = map;
      expect(control.element.parentNode).toBe(map.getContainer());

      // Should be activated by default.
      expect(control.active).toBe(false);
      expect(control.element.innerHTML).toBe('');

      // on deactivation
      control.active = true;
      expect(control.element.innerHTML).toBe('copyright 1');
    });

    test('should add copyrights in the map container element then remove it.', () => {
      map = new Map({
        target: document.body,
        layers: [
          new Layer({
            copyrights: ['copyright value'],
            olLayer,
          }),
        ],
      });

      const control = new CopyrightControl();

      // Add control
      control.map = map;
      expect(control.element.parentNode).toBe(map.getContainer());

      // Remove control
      control.map = null;
      expect(control.element.parentNode).toBe(null);
    });

    test('should add copyrights in the target element then remove it.', () => {
      map = new Map({
        target: document.body,
        layers: [
          new Layer({
            copyrights: ['copyright value'],
            olLayer,
          }),
        ],
      });

      const target = document.createElement('div');
      target.setAttribute('id', 'copyright');
      document.body.appendChild(target);

      const control = new CopyrightControl({
        target: document.getElementById('copyright'),
      });

      // Add control
      control.map = map;
      expect(control.element.parentNode).toBe(target);

      // Remove control
      control.map = null;
      expect(control.element.parentNode).toBe(null);
    });

    test('should render custom copyrights with the render method ', () => {
      const control = new CopyrightControl({
        active: true,
        render() {
          this.element.innerHTML = this.active
            ? this.getCopyrights().join(', ')
            : '';
        },
      });

      map = new Map({
        target: document.body,
        layers: [
          new Layer({
            copyrights: ['copyright 1', 'copyright 2', 'copyright 3'],
            olLayer,
          }),
        ],
      });
      // Add control
      control.map = map;
      expect(control.element.innerHTML).toBe(
        'copyright 1, copyright 2, copyright 3',
      );
    });
  });
});
