import { fromLonLat } from 'ol/proj';
import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/SearchMixin';

/**
 * Search stations.
 *
 * @example
 * import { Map, StopsFinderControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 *   controls: [
 *     new StopsFinderControl({
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
class StopsFinderControl extends mixin(Control) {
  /**
   * @private
   */
  onSuggestionClick({ geometry }) {
    const coord = fromLonLat(geometry.coordinates);
    this.map.getView().setCenter(coord);
  }
}

export default StopsFinderControl;
