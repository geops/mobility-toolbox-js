import { unByKey } from 'ol/Observable';
import CommonControl from '../../common/controls/Control';
import mixin from '../../common/controls/mixins/Copyright';
import getMapboxMapCopyrights from '../../common/getMapboxMapCopyrights';

class CopyrightControl extends mixin(CommonControl) {
  /**
   * @ignore
   */
  defineProperties(opts) {
    super.defineProperties(opts);
    let { active } = opts;
    const onRender = this.render.bind(this);
    Object.defineProperties(this, {
      active: {
        get: () => {
          return active;
        },
        set: (newActiveVal) => {
          active = newActiveVal;
          if (newActiveVal) {
            this.addCopyrightContainer(this.map.getContainer());
            this.map.on('change:layers', onRender);
            this.map.on('change:mobilityLayers', onRender);
            this.map.once('load', () => this.render());
          } else {
            this.removeCopyrightContainer();
            this.map.off('change:layers', onRender);
            this.map.off('change:mobilityLayers', onRender);
            unByKey(this.layerChangeKey);
          }
        },
        configurable: true,
      },
    });
  }

  getCopyrights() {
    return super.getCopyrights().concat(getMapboxMapCopyrights(this.map));
  }
}

export default CopyrightControl;
