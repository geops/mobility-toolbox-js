import CommonCopyrightControl from '../../common/controls/Copyright';
import getMapboxMapCopyrights from '../../common/getMapboxMapCopyrights';

class CopyrightControl extends CommonCopyrightControl {
  activate(map) {
    super.activate(map, map.getContainer());
    map.on('styledata', this.renderCopyrights.bind(this));
  }

  getCopyrights() {
    return super
      .getCopyrights()
      .concat(getMapboxMapCopyrights(this.map));
  }

  deactivate() {
    this.map.off('styledata', this.renderCopyrights);
  }
}

export default CopyrightControl;
