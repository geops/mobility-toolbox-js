import { Feature, Point } from 'geojson';
import { fromLonLat } from 'ol/proj';
import StopFinderControlCommon from '../../common/controls/StopFinderControlCommon';

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
 */
class StopFinderControl extends StopFinderControlCommon {
  /**
   * @private
   */
  onSuggestionClick(suggestion: Feature) {
    const coord = fromLonLat((suggestion.geometry as Point).coordinates);
    this.map.getView().setCenter(coord);
  }
}

export default StopFinderControl;
