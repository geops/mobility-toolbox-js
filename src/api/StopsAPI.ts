import HttpAPI from './HttpAPI';
import { StopsParameters, StopsResponse } from '../types';

export type StopsAPIOptions = {
  url?: string;
  apiKey?: string;
};

/**
 * Access to the [geOps Stops api](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
 *
 * @example
 * import { StopsAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new StopsAPI({
 *   url: 'https://api.geops.io/stops/v1/',
 *   apiKey: [yourApiKey]
 * });
 *
 * @public
 */
class StopsAPI extends HttpAPI {
  /**
   * Constructor
   *
   * @param {StopsAPIOptions} options Options.
   * @param {string} [options.url='https://api.geops.io/stops/v1/'] Service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   */
  constructor(options: StopsAPIOptions = {}) {
    super({ url: 'https://api.geops.io/stops/v1/', ...options });
  }

  /**
   * Search fo stops.
   *
   * @param {StopsParameters} params Request parameters. See [Stops service documentation](https://developer.geops.io/apis/stops).
   * @param {RequestInit} config Options for the fetch request.
   * @return {Promise<StopsResponse>} An GeoJSON feature collection with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  search(params: StopsParameters, config: RequestInit): Promise<StopsResponse> {
    return this.fetch('', params, config);
  }
}

export default StopsAPI;
