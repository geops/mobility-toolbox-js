import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/CopyrightMixin';
import removeDuplicate from '../../common/utils/removeDuplicate';

class Copyright extends mixin(Control) {
  constructor(options) {
    super(options);
    this.onPostRender = this.onPostRender.bind(this);
  }

  getCopyrights() {
    if (!this.map) {
      return [];
    }
    let copyrights = [];
    this.map.getLayers().forEach((layer) => {
      if (
        layer &&
        layer.getSource &&
        layer.getSource() &&
        layer.getSource().getAttributions()
      ) {
        copyrights = copyrights.concat(
          layer.getSource().getAttributions()(this.frameState),
        );
      }
    });
    return removeDuplicate(copyrights);
  }

  activate() {
    super.activate();
    if (this.map) {
      this.map.on('postrender', this.onPostRender);
    }
  }

  deactivate() {
    if (this.map) {
      this.map.un('postrender', this.onPostRender);
    }
    super.deactivate();
  }

  onPostRender(evt) {
    if (this.map && this.element) {
      this.frameState = evt.frameState;
      this.render();
    }
  }
}

export default Copyright;
