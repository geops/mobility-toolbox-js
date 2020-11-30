import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Map from '../Map';
import Layer from '../layers/Layer';
import CopyrightControl from './Copyright';

const olLayer = new VectorLayer({ source: new VectorSource() });

describe('Copyright', () => {
  let map;

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
