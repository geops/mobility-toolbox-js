import { fromLonLat } from 'ol/proj';
import Control from '../../common/controls/Control';
import mixin from '../../common/mixins/SearchMixin';

/**
 * Search stations.
 *
 * @example
 * import { Map, SearchControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 *   controls: [
 *     new SearchControl({
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
class SearchControl extends mixin(Control) {
  onSuggestionClick({ geometry }) {
    const coord = fromLonLat(geometry.coordinates);
    this.map.getView().setCenter(coord);
  }
}

export default SearchControl;
