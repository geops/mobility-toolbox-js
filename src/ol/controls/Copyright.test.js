import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Map from '../Map';
import Layer from '../layers/Layer';
import CopyrightControl from './Copyright';

const olLayer = new VectorLayer({ source: new VectorSource() });

describe('Copyright', () => {
  let map;

  afterEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = '';
  });

  describe('Default CopyrightControl', () => {
    beforeEach(() => {
      map = new Map({ target: document.body });
    });

    test('should render initial copyright empty, when no layers.', () => {
      const copyright = document.getElementById('mb-copyright');
      expect(copyright.innerHTML).toBe('');
    });

    test('should render default copyrights empty, and delete duplicates.', () => {
      const layer = new Layer({
        copyrights: ['layer copyright', 'test', 'layer copyright'],
        olLayer,
      });
      map.addLayer(layer);

      const copyright = document.getElementById('mb-copyright');
      expect(copyright.innerHTML).toBe('layer copyright | test');
    });
  });

  test('should render copyrights in target element.', () => {
    const target = document.createElement('div');
    target.setAttribute('id', 'copyright');
    document.body.appendChild(target);

    const targetCopyright = new CopyrightControl({
      targetElement: document.getElementById('copyright'),
    });

    map = new Map({
      target: document.body,
      mobilityControls: [targetCopyright],
    });

    const layer = new Layer({
      copyrights: ['copyright value'],
    });
    map.addLayer(layer);
    const copyrightWrapper = document.getElementById('copyright');
    expect(copyrightWrapper.innerHTML).toBe(
      '<div id="mb-copyright" style="position: absolute; bottom: 0px; right: 0px; font-size: 10px; padding: 0px 10px; background-color: rgba(255, 255, 255, 0.5);">copyright value</div>',
    );
    const copyright = document.getElementById('mb-copyright');
    expect(copyright.innerHTML).toBe('copyright value');
  });

  test('should activate/dactivate copyrights by default.', () => {
    map = new Map({ target: document.body });

    const customCopyright = new CopyrightControl(map);

    const layer = new Layer({
      copyrights: ['copyright 1'],
      olLayer,
    });

    map.addLayer(layer);
    map.addMobilityControl(customCopyright);
    const copyright = document.getElementById('mb-copyright');
    const spy = jest.spyOn(customCopyright, 'removeCopyrightContainer');

    // Should be activated by default.
    expect(customCopyright.active).toBe(true);
    expect(copyright.innerHTML).toBe('copyright 1');

    customCopyright.active = false;
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
