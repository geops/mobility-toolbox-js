import { Feature, Point } from 'geojson';
import { fromLonLat } from 'ol/proj';
import Control, { Options } from 'ol/control/Control';
import StopFinderControlCommon from '../../common/controls/StopFinderControlCommon';
import createDefaultStopFinderElement from '../../common/utils/createDefaultStopFinderElt';

export type StopFinderControlOptions = Options &
  StopFinderControlCommon & {
    className?: string;
  };

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
 * map.addControl(control);
 *
 *
 * @see <a href="/example/ol-search">Openlayers search example</a>
 * @public
 */
class StopFinderControl extends Control {
  controller: StopFinderControlCommon;

  constructor(options: StopFinderControlOptions) {
    const element = createDefaultStopFinderElement();
    element.className = options?.className || 'mbt-stop-finder';
    const opt = { element, ...(options || {}) };
    super(opt);
    this.controller = new StopFinderControlCommon({
      onSuggestionClick: this.onSuggestionClick.bind(this),
      ...opt,
    });
  }

  /**
   * @private
   */
  onSuggestionClick(suggestion: Feature) {
    const coord = fromLonLat((suggestion.geometry as Point).coordinates);
    this.getMap()?.getView().setCenter(coord);
  }
}

export default StopFinderControl;
