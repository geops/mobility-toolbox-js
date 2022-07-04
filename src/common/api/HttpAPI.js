import BaseObject from 'ol/Object';

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
    const url = new URL(`${this.url}${path || ''}`);

    if (this.apiKey) {
      url.searchParams.set('key', this.apiKey);
    }

    const searchParams = params || {};
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    if (this.apiKey) {
      url.searchParams.set('key', this.apiKey);
    }

    return fetch(url.toString(), config).then((response) => {
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
