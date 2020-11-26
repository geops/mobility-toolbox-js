import MapboxLayer from '../layers/MapboxLayer';
import CommonControl from '../../common/controls/Control';
import mixin from '../../common/controls/mixins/Copyright';

class Copyright extends mixin(CommonControl) {
  constructor(options = {}) {
    super(options);
  }

  onLayerChange() {
    this.renderCopyrights();

    this.map.getMobilityLayers().forEach((l) => {
      if (l instanceof MapboxLayer) {
        l.mbMap.once('load', () => {
          this.renderCopyrights();
        });
      }
    });
  }

  activate(map) {
    this.map = map;
    this.active = true;
    const target = this.map.getTargetElement();
    if (target) {
      this.addCopyrightContainer(target);
    }
    this.map.on('change:layers', this.onLayerChange.bind(this));
    this.map.on('change:mobilityLayers', this.onLayerChange.bind(this));
  }

  getCopyrights() {
    let copyrights = super.getCopyrights();

    this.map.getMobilityLayers().forEach((l) => {
      if (l.copyrights) {
        copyrights = copyrights.concat(l.copyrights);
      }
    });
    return [...new Set(copyrights.filter((c) => c.trim()))];
  }

  deactivate() {
    this.map = null;
    this.active = false;
    this.removeCopyrightContainer();
    this.map.un('change:layers', this.onLayerChange);
    this.map.un('change:mobilityLayers', this.onLayerChange);
  }
}

export default Copyright;
