import HttpAPI from './HttpAPI';
import { RoutingParameters, RoutingResponse } from '../types';

export type RoutingAPIOptions = {
  url?: string;
  apiKey?: string;
};

/**
 * This class provides convenience methods to use to the [geOps Routing API](https://developer.geops.io/apis/routing).
 *
 * @example
 * import { RoutingAPI } from 'mobility-toolbox-js';
 *
 * const api = new RoutingAPI({
 *   apiKey: [yourApiKey]
 * });
 *
 * @public
 */
class RoutingAPI extends HttpAPI {
  /**
   * Constructor
   *
   * @param {RoutingAPIOptions} options Options.
   * @param {string} [options.url='https://api.geops.io/routing/v1/'] Service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   */
  constructor(options: RoutingAPIOptions = {}) {
    super({ url: 'https://api.geops.io/routing/v1/', ...options });
  }

  /**
   * Route.
   *
   * @param {RoutingParameters} params Request parameters. See [Routing service documentation](https://developer.geops.io/apis/routing/).
   * @param {RequestInit} config Options for the fetch request.
   * @return {Promise<RoutingResponse>} An GeoJSON feature collection with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  route(
    params: RoutingParameters,
    config: RequestInit,
  ): Promise<RoutingResponse> {
    return this.fetch('', params, config);
  }
}

export default RoutingAPI;
