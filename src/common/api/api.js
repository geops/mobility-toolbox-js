import qs from 'query-string';

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
   * Display log message on error but not on AbortError.
   * @ignore
   */
  static handleError(reqType, err) {
    if (err.name === 'AbortError') {
      // Ignore AbortError.
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(`Fetch ${reqType} request failed: `, err);
    // Propagate the error.
    throw err;
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
    if (!this.apiKey) {
      // eslint-disable-next-line no-console
      console.warn(`No apiKey defined for request to ${this.url}`);
      return Promise.resolve({});
    }
    return fetch(`${this.url}${path}?${qs.stringify(clone)}`, config)
      .then((response) => {
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
      })
      .catch((err) => {
        API.handleError(`${this.url}${path}`, err);
      });
  }
}

export default API;
