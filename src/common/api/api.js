import qs from 'query-string';
import { handleError, readJsonResponse } from './utils';

/**
 * Common class to access to a geOps api.
 *
 * @example
 * import { API } from 'mobility-toolbox-js/api';
 *
 * const api = new API({
 *   url: [yourUrl],
 *   apiKey: [yourApiKey]
 * });
 *
 * @classproperty {string} url Url of the service.
 * @classproperty {string} apiKey Api key to access the service.
 */
class API {
  constructor(options = {}) {
    /** @ignore */
    this.url = options.url;

    /** @ignore */
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   * @ignore
   */
  fetch(path = '', params = {}, config) {
    // Clean requets parameters, removing undefined and null values.
    const urlParams = { ...params, key: this.apiKey };
    const clone = { ...urlParams };
    Object.keys(urlParams).forEach(
      (key) =>
        (clone[key] === undefined || clone[key] === null) && delete clone[key],
    );
    return fetch(`${this.url}${path}?${qs.stringify(clone)}`, config)
      .then(readJsonResponse)
      .catch((err) => {
        handleError(`${this.url}${path}`, err);
      });
  }
}

export default API;
