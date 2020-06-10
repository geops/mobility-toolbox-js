import qs from 'query-string';
import { handleError, readJsonResponse } from '../utils';

/**
 * Access to Stops api.
 * @class
 */
class StopsAPI {
  constructor(options = {}) {
    this.url = options.url || 'https://api.geops.io/stops/v1/';
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   * @private
   */
  fetch(url, params = {}, config) {
    const urlParams = { ...params, key: this.apiKey };
    return fetch(`${url}?${qs.stringify(urlParams)}`, config).then(
      readJsonResponse,
    );
  }

  /**
   * Search.
   * @param {Object} params Request parameters.
   * @param {AbportController} abortController
   */
  search(params, abortController = {}) {
    return this.fetch(this.url, params, {
      signal: abortController.signal,
    })
      .then((featureCollection) => featureCollection.features)
      .catch((err) => {
        handleError('search', err);
      });
  }
}

export default StopsAPI;
