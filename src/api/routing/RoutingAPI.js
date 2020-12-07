import Api from '../Api';

/**
 * Access to the [Routing service](https://developer.geops.io/apis/routing/).
 *
 * @example
 * import { RoutingAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RoutingAPI({
 *   url: 'https://api.geops.io/routing/v1/',
 *   apiKey: [yourApiKey]
 * });
 *
 * @classproperty {string} url Url of the service.
 * @classproperty {string} apiKey Api key to access the service.
 */
class RoutingAPI extends Api {
  constructor(options = {}) {
    super({
      url: 'https://api.geops.io/routing/v1/',
      ...options,
    });
  }
}

export default RoutingAPI;
