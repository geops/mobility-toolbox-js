import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/CopyrightMixin';

class Copyright extends mixin(Control) {
  constructor(options) {
    super(options);
    this.onLayerChange = this.onLayerChange.bind(this);
  }

  onLayerChange() {
    if (this.map) {
      this.render();

      this.map.getMobilityLayers().forEach((layer) => {
        if (layer.mbMap) {
          layer.mbMap.once('load', () => {
            this.render();
          });
        }
      });
    }
  }

  activate() {
    super.activate();
    if (this.map) {
      this.map.on('change:layers', this.onLayerChange);
    }
  }

  deactivate() {
    if (this.map) {
      this.map.un('change:layers', this.onLayerChange);
    }
    super.deactivate();
  }
}

export default Copyright;
