import API from '../../common/api/api';

/**
 * Access to the [Routing service](https://developer.geops.io/apis/routing).
 *
 * @example
 * import { RoutingAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RoutingAPI({
 *   url: 'https://api.geops.io/routing/v1/',
 *   apiKey: [yourApiKey]
 * });
 *
 */
class RoutingAPI extends API {
  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} [options.url='https://api.geops.io/routing/v1/'] Service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   */
  constructor(options = {}) {
    super({ url: 'https://api.geops.io/routing/v1/', ...options });
  }

  /**
   * Route.
   *
   * @param {RoutingSearchParams} params Request parameters. See [Stops service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<GeoJSONFeature[]>} An array of GeoJSON features with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  route(params, abortController = {}) {
    return this.fetch('', params, {
      signal: abortController.signal,
    }).then((featureCollection) => featureCollection.features);
  }
}

export default RoutingAPI;
