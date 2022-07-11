import { fromLonLat } from 'ol/proj';
import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/StopFinderMixin';

/**
 * Search stations.
 *
 * @example
 * import { Map } from 'ol';
 * import { StopFinderControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 * });
 *
 * const control = new StopFinderControl({
 *   apiKey: [yourApiKey]
 * });
 *
 * control.attachToMap(map);
 *
 *
 * @see <a href="/example/ol-search">Openlayers search example</a>
 *
 * @extends {Control}
 * @implements {StopFinderInterface}
 */
class StopFinderControl extends mixin(Control) {
  /**
   * @private
   */
  onSuggestionClick({ geometry }) {
    const coord = fromLonLat(geometry.coordinates);
    this.map.getView().setCenter(coord);
  }
}

export default StopFinderControl;
