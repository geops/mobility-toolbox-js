import qs from 'query-string';
import BaseObject from 'ol/Object';

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
class API extends BaseObject {
  constructor(options = {}) {
    super();
    /** @ignore */
    this.url = options.url;

    /** @ignore */
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   * @ignore
   */
  fetch(path, params, config) {
    // Clean requets parameters, removing undefined and null values.
    const urlParams = { ...(params || {}), key: this.apiKey };
    const clone = { ...urlParams };
    Object.keys(urlParams).forEach(
      (key) =>
        (clone[key] === undefined || clone[key] === null) && delete clone[key],
    );
    if (!this.apiKey) {
      // eslint-disable-next-line no-console
      return Promise.reject(
        new Error(`No apiKey defined for request to ${this.url}`),
      );
    }
    return fetch(
      `${this.url}${path || ''}?${qs.stringify(clone)}`,
      config,
    ).then((response) => {
      try {
        return response.json().then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          return data;
        });
      } catch (err) {
        return Promise.reject(new Error(err));
      }
    });
  }
}

export default API;
