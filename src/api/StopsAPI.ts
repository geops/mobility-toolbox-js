import HttpAPI from './HttpAPI';
import { StopsParameters, StopsResponse } from '../types';

export type StopsAPIOptions = {
  url?: string;
  apiKey?: string;
};

/**
 * This class provides convenience methods to use to the [geOps Stops API](https://developer.geops.io/apis/stops/).
 *
 * @example
 * import { StopsAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new StopsAPI({
 *   apiKey: [yourApiKey],
 *   // url: 'https://api.geops.io/stops/v1/',
 * });
 *
 * const stops = await api.search({ q:"Bern" });
 *
 * console.log('Log stops:', JSON.stringify(stops));
 *
 * @public
 */
class StopsAPI extends HttpAPI {
  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {string} [options.url='https://api.geops.io/stops/v1/'] Url of the [geOps stops API](https://developer.geops.io/apis/stops/).
   * @public
   */
  constructor(options: StopsAPIOptions = {}) {
    super({ url: 'https://api.geops.io/stops/v1/', ...options });
  }

  /**
   * Search for stops.
   *
   * @param {StopsParameters} params Request parameters. See [Stops API documentation](https://developer.geops.io/apis/stops).
   * @param {FetchOptions} config Options for the fetch request.
   * @returns {Promise<StopsResponse>} An GeoJSON feature collection with coordinates in [EPSG:4326](http://epsg.io/4326). See [Stops API documentation](https://developer.geops.io/apis/stops).
   * @public
   */
  search(params: StopsParameters, config: RequestInit): Promise<StopsResponse> {
    return this.fetch('', params, config);
  }
}

export default StopsAPI;
