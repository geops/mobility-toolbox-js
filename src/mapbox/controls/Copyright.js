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
    Object.defineProperties(this, {
      active: {
        get: () => {
          return active;
        },
        set: (newActiveVal) => {
          active = newActiveVal;
          if (newActiveVal) {
            this.addCopyrightContainer(this.map.getContainer());

            this.map.on('change:layers', this.renderCopyrights.bind(this));
            this.map.on(
              'change:mobilityLayers',
              this.renderCopyrights.bind(this),
            );
            this.map.once('load', () => this.renderCopyrights());
          } else {
            this.removeCopyrightContainer();
            this.map.off('change:layers', this.renderCopyrights);
            this.map.off('change:mobilityLayers', this.renderCopyrights);
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
