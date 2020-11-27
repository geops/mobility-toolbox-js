import { unByKey } from 'ol/Observable';
import CommonControl from '../../common/controls/Control';
import mixin from '../../common/controls/mixins/Copyright';
import getMapboxMapCopyrights from '../../common/getMapboxMapCopyrights';

class CopyrightControl extends mixin(CommonControl) {
  activate() {
    this.active = true;
    this.addCopyrightContainer(this.map.getContainer());

    this.map.on('change:layers', this.renderCopyrights.bind(this));
    this.map.on('change:mobilityLayers', this.renderCopyrights.bind(this));
    this.map.once('load', () => this.renderCopyrights());
  }

  getCopyrights() {
    return super.getCopyrights().concat(getMapboxMapCopyrights(this.map));
  }

  deactivate() {
    this.removeCopyrightContainer();
    this.map.off('change:layers', this.renderCopyrights);
    this.map.off('change:mobilityLayers', this.renderCopyrights);
    unByKey(this.layerChangeKey);
  }
}

export default CopyrightControl;
