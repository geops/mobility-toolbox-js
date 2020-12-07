import Api from '../Api';

/**
 * Access to the [Stops service](https://developer.geops.io/apis/stops/).
 *
 * @example
 * import { StopsAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new StopsAPI({
 *   url: 'https://api.geops.io/stops/v1/',
 *   apiKey: [yourApiKey]
 * });
 *
 * @classproperty {string} url Url of the service.
 * @classproperty {string} apiKey Api key to access the service.
 */
class StopsAPI extends Api {
  constructor(options = {}) {
    super({
      url: 'https://api.geops.io/stops/v1/',
      ...options,
    });
  }
}

export default StopsAPI;
