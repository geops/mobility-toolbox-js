import { RoutingParameters, RoutingResponse } from '../types';
import HttpAPI from './HttpAPI';

export interface RoutingAPIOptions {
  apiKey?: string;
  url?: string;
}

/**
 * This class provides convenience methods to use to the [geOps Routing API](https://developer.geops.io/apis/routing).
 *
 * @example
 * import { RoutingAPI } from 'mobility-toolbox-js';
 *
 * const api = new RoutingAPI({
 *   apiKey: [yourApiKey],
 *   // url: 'https://api.geops.io/routing/v1/',
 * });
 *
 * const route = await api.route({
 *   via: "freiburg|basel%20sbb|bern",
 *   mot: "rail"
 * });
 *
 * console.log('Log route:', JSON.stringify(route));
 *
 * @public
 */
class RoutingAPI extends HttpAPI {
  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   * @param {string} [options.url='https://api.geops.io/routing/v1/'] Service url.
   * @public
   */
  constructor(options: RoutingAPIOptions = {}) {
    super({ url: 'https://api.geops.io/routing/v1/', ...options });
  }

  /**
   * Calculate a route.
   *
   * @param {RoutingParameters} params Request parameters. See [geOps Routing API](https://developer.geops.io/apis/routing/).
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<RoutingResponse>} An GeoJSON feature collection with coordinates in [EPSG:4326](http://epsg.io/4326).
   * @public
   */
  route(
    params: RoutingParameters,
    config: RequestInit,
  ): Promise<RoutingResponse> {
    return this.fetch('', params, config);
  }
}

export default RoutingAPI;
