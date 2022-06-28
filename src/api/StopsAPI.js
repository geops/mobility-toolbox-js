import HttpAPI from '../common/api/HttpAPI';

/**
 * Access to the [Stops service](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
 *
 * @example
 * import { StopsAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new StopsAPI({
 *   url: 'https://api.geops.io/stops/v1/',
 *   apiKey: [yourApiKey]
 * });
 *
 */
class StopsAPI extends HttpAPI {
  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} [options.url='https://api.geops.io/stops/v1/'] Service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   */
  constructor(options = {}) {
    super({ url: 'https://api.geops.io/stops/v1/', ...options });
  }

  /**
   * Search.
   *
   * @param {StopsSearchParams} params Request parameters. See [Stops service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @return {Promise<GeoJSONFeatureCollection>} An GeoJSON feature collection with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  search(params, abortController = {}) {
    return this.fetch('', params, {
      signal: abortController.signal,
    });
  }
}

export default StopsAPI;
