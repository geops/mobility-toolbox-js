import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/CopyrightMixin';
import getMapboxMapCopyrights from '../../common/utils/getMapboxMapCopyrights';

class CopyrightControl extends mixin(Control) {
  constructor(options) {
    super(options);
    this.render = this.render().bind(this);
  }

  activate() {
    super.activate();
    if (this.map) {
      this.map.on('sourcedata', this.render);
      this.map.on('styledata', this.render);
      this.map.on('idle', this.render);
    }
  }

  deactivate() {
    if (this.map) {
      this.map.off('sourcedata', this.render);
      this.map.off('styledata', this.render);
      this.map.off('idle', this.render);
    }
    super.deactivate();
  }

  getCopyrights() {
    return getMapboxMapCopyrights(this.map);
  }
}

export default CopyrightControl;
