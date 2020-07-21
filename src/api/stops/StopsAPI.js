import qs from 'query-string';
import { handleError, readJsonResponse } from '../utils';

/**
 * Access to the [Stops service](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
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
class StopsAPI {
  constructor(options = {}) {
    /** @ignore */
    this.url = options.url || 'https://api.geops.io/stops/v1/';
    /** @ignore */
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   * @ignore
   */
  fetch(url, params = {}, config) {
    const urlParams = { ...params, key: this.apiKey };
    return fetch(`${url}?${qs.stringify(urlParams)}`, config).then(
      readJsonResponse,
    );
  }

  /**
   * Search.
   *
   * @param {Object} params Request parameters. See [Stops service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<GeoJSONFeature[]>} An array of GeoJSON features with coordinates in [EPSG:4326](http://epsg.io/4326).
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
