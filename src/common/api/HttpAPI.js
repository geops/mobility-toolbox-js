import BaseObject from 'ol/Object';
import getUrlWithParams from '../utils/getUrlWithParams';
/**
 * Common class to access to a geOps api using http.
 *
 * @example
 * import { API } from 'mobility-toolbox-js/api';
 *
 * const api = new HttpApi({
 *   url: [yourUrl],
 *   apiKey: [yourApiKey]
 * });
 *
 * @classproperty {string} url Url of the service.
 * @classproperty {string} apiKey Api key to access the service.
 */
class HttpAPI extends BaseObject {
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
    if (!this.apiKey && !/key=/.test(this.url)) {
      // eslint-disable-next-line no-console
      return Promise.reject(
        new Error(`No apiKey defined for request to ${this.url}`),
      );
    }

    // Clean requets parameters, removing undefined and null values.
    const searchParams = params || {};
    const url = getUrlWithParams(`${this.url}${path || ''}`, {
      key: this.apiKey,
      ...searchParams,
    });

    return fetch(url, config).then((response) => {
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

export default HttpAPI;
