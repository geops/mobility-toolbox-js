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
    const renderCopyrights = this.renderCopyrights.bind(this);
    Object.defineProperties(this, {
      active: {
        get: () => {
          return active;
        },
        set: (newActiveVal) => {
          active = newActiveVal;
          if (newActiveVal) {
            this.addCopyrightContainer(this.map.getContainer());
            this.map.on('change:layers', renderCopyrights);
            this.map.on('change:mobilityLayers', renderCopyrights);
            this.map.once('load', () => this.renderCopyrights());
          } else {
            this.removeCopyrightContainer();
            this.map.off('change:layers', renderCopyrights);
            this.map.off('change:mobilityLayers', renderCopyrights);
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
