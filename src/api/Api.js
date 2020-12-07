import qs from 'query-string';

/**
 * Access to the [Routing service](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
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
class RoutingAPI {
  /**
   * Remove undefined values of url params.
   * @ignore
   */
  static cleanParams(params) {
    const clone = { ...params };
    Object.keys(clone).forEach(
      (key) =>
        (clone[key] === undefined || clone[key] === null) && delete clone[key],
    );
    return clone;
  }

  /**
   * Read json response.
   * @throws Error if parsing failed.
   * @ignore
   */
  static readJsonResponse(response) {
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
  }

  constructor(options = {}) {
    /** @ignore */
    this.url = options.url || 'https://api.geops.io/routing/v1/';
    /** @ignore */
    this.apiKey = options.apiKey;
  }

  /**
   * Fetch.
   *
   * @param {RoutingSearchParams} params Request parameters. See [Routing service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<GeoJSONFeature[]>} An array of GeoJSON features with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  fetch(params = {}, abortController = {}) {
    const urlParams = RoutingAPI.cleanParams({ ...params, key: this.apiKey });
    const url = `${this.url}?${qs.stringify(urlParams)}`;
    return fetch(url, {
      signal: abortController.signal,
    }).then((data) => data.json());
  }
}

export default RoutingAPI;
