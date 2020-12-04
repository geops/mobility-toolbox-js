import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/CopyrightMixin';
import getMapboxMapCopyrights from '../../common/utils/getMapboxMapCopyrights';

/**
 * Display layer's copyrights.
 *
 * @example
 * import { Map, CopyrightControl } from 'mobility-toolbox-js/mapbox';
 *
 * const map = new Map({
 *   container: 'map',
 *   style: `https://maps.geops.io/styles/travic/style.json?key=${window.apiKey}`,
 *   controls: [
 *     new CopyrightControl()
 *   ]
 * });
 *
 *
 * @see <a href="/example/mb-copyright">Mapbox copyright example</a>
 *
 * @extends {Control}
 * @implements {CopyrightInterface}
 */
class CopyrightControl extends mixin(Control) {
  constructor(options) {
    super(options);
    this.render = this.render.bind(this);
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
