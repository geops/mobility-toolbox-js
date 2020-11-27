import MapboxLayer from '../layers/MapboxLayer';
import CommonControl from '../../common/controls/Control';
import mixin from '../../common/controls/mixins/Copyright';

class Copyright extends mixin(CommonControl) {
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
            this.addCopyrightContainer(this.map.getTargetElement());
            this.map.on('change:layers', this.onLayerChange.bind(this));
            this.map.on('change:mobilityLayers', this.onLayerChange.bind(this));
          } else {
            this.removeCopyrightContainer();
            this.map.un('change:layers', this.onLayerChange);
            this.map.un('change:mobilityLayers', this.onLayerChange);
          }
        },
        configurable: true,
      },
    });
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

  getCopyrights() {
    let copyrights = super.getCopyrights();

    this.map.getMobilityLayers().forEach((l) => {
      if (l.copyrights) {
        copyrights = copyrights.concat(l.copyrights);
      }
    });

    return copyrights;
  }
}

export default Copyright;
