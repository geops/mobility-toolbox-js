import { fromLonLat } from 'ol/proj';
import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/SearchMixin';

/**
 * Search stations.
 *
 * @example
 * import { Map, StopFinderControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 *   controls: [
 *     new StopFinderControl({
 *       apiKey: [yourApiKey]
 *     })
 *   ]
 * });
 *
 *
 * @see <a href="/example/ol-search">Openlayers search example</a>
 *
 * @extends {Control}
 * @implements {SearchInterface}
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
