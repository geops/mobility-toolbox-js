import { unByKey } from 'ol/Observable';
import CommonControl from '../../common/controls/Control';
import mixin from '../../common/controls/mixins/Copyright';
import getMapboxMapCopyrights from '../../common/getMapboxMapCopyrights';

class CopyrightControl extends mixin(CommonControl) {
  activate() {
    super.activate();
    this.addCopyrightContainer(this.map.getContainer());

    this.map.on('change:layers', this.renderAllCopyrights.bind(this));
    this.map.on('change:mobilityLayers', this.renderAllCopyrights.bind(this));
    this.map.once('load', () => this.renderAllCopyrights());
  }

  getCopyrights() {
    return super.getCopyrights().concat(getMapboxMapCopyrights(this.map));
  }

  deactivate() {
    this.removeCopyrightContainer();
    this.map.off('change:layers', this.renderAllCopyrights);
    this.map.off('change:mobilityLayers', this.renderAllCopyrights);
    unByKey(this.layerChangeKey);
  }
}

export default CopyrightControl;
