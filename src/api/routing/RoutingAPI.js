import API from '../../common/api/api';

/**
 * Access to the [Routing service](https://developer.geops.io/apis/routing).
 *
 * @example
 * import { RoutingAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RoutingAPI({
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
   * @param {string} options.mot Mean of transport on load.
   */
  constructor(options = {}) {
    super({
      ...options,
      url: options.url || 'https://api.geops.io/routing/v1/',
    });
  }

  /**
   * Route.
   *
   * @param {RoutingSearchParams} params Request parameters. See [Routing service documentation](https://developer.geops.io/apis/routing/).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @return {Promise<GeoJSONFeatureCollection>} An GeoJSON feature collection with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  route(params, abortController = new AbortController()) {
    return this.fetch('', params, {
      signal: abortController.signal,
    });
  }
}

export default RoutingAPI;
