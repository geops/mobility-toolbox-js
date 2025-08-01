import Control from 'ol/control/Control';
import { fromLonLat } from 'ol/proj';

import StopFinderControlCommon from '../../common/controls/StopFinderControlCommon';
import createDefaultStopFinderElement from '../../common/utils/createDefaultStopFinderElt';

import type { Point } from 'geojson';
import type { Options } from 'ol/control/Control';

import type { ArrayElement } from '../../common/controls/StopFinderControlCommon';
import type { StopsResponse } from '../../types';

export type StopFinderControlOptions = {
  className?: string;
} & Options &
  StopFinderControlCommon;

/**
 * This OpenLayers control allows to search stations from the [geOps Stops API](https://developer.geops.io/apis/stops/).
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
 *
 * @extends {ol/control/Control~Control}
 *
 * @public
 */
class StopFinderControl extends Control {
  controller: StopFinderControlCommon;

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {HTMLElement} options.element HTML element where to attach input and suggestions.
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {StopsSearchParams} [options.apiParams={ limit: 20 }] Request parameters. See [geOps Stops API documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   * @param {string} [options.placeholder='Search for a stop...'] Input field placeholder.
   * @param {string} [options.url='https://api.geops.io/stops/v1/'] [geOps Stops API](https://developer.geops.io/apis/stops/) url.
   * @public
   */
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

  onSuggestionClick(
    suggestion: ArrayElement<NonNullable<StopsResponse['features']>>,
  ) {
    const coord = fromLonLat((suggestion.geometry as Point).coordinates);
    this.getMap()?.getView().setCenter(coord);
  }

  /**
   * Search for stations using a query.
   *
   * @param {string} q Query used to search stops.
   * @param {AbortController} abortController  Abort controller used to abort requests.
   * @returns {Promise<Array<GeoJSONFeature>>}
   * @public
   */
  search(q: string, abortController: AbortController) {
    return this.controller.search(q, abortController);
  }
}

export default StopFinderControl;
