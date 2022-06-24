import { inView } from 'ol/layer/Layer';
import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/CopyrightMixin';
import removeDuplicate from '../../common/utils/removeDuplicate';

/**
 * Display layer's copyrights.
 *
 * @example
 * import { Map } from 'ol';
 * import { CopyrightControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 * });
 * const control = new CopyrightControl();
 * control.attachToMap(map)
 *
 *
 * @see <a href="/example/ol-copyright">Openlayers copyright example</a>
 *
 * @extends {Control}
 * @implements {CopyrightInterface}
 */
class CopyrightControl extends mixin(Control) {
  constructor(options) {
    super(options);
    this.onPostRender = this.onPostRender.bind(this);
  }

  getCopyrights() {
    if (!this.frameState) {
      return [];
    }
    let copyrights = [];

    // This code loop comes mainly from ol.
    this.frameState.layerStatesArray.forEach((layerState) => {
      const { layer } = layerState;
      if (
        inView(layerState, this.frameState.viewState) &&
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
      /**
       * @ignore
       */
      this.frameState = evt.frameState;
      this.render();
    }
  }
}

export default CopyrightControl;
