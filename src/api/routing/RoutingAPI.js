import API from '../../common/api/api';

/**
 * Access to the [Routing service](https://developer.geops.io/apis/routing).
 *
 * @example
 * import { RoutingAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RoutingAPI({
 *   apiKey: [yourApiKey]
 * });
 *
 */
class RoutingAPI extends API {
  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} [options.url='https://api.geops.io/routing/v1/'] Service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   * @param {string} options.mot Mean of transport on load.
   */
  constructor(options = {}) {
    super({
      ...options,
      url: options.url || 'https://api.geops.io/routing/v1/',
    });

    Object.defineProperties(this, {
      mot: {
        get: () => {
          return this.get('mot');
        },
        set: (newMot) => {
          if (newMot) {
            this.set('mot', newMot);
          }
        },
      },
    });

    this.mot = options.mot || 'bus';
  }

  /**
   * Sets the current mot and redraws route.
   * @param {string} motString String defining the mean of transport (e.g. bus, rail, foot...).
   */
  setMot(motString) {
    this.set('mot', motString);
  }

  /**
   * Route.
   *
   * @param {RoutingSearchParams} params Request parameters. See [Routing service documentation](https://developer.geops.io/apis/routing/).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<GeoJSONFeature[]>} An array of GeoJSON features with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  route(params, abortController = new AbortController()) {
    return this.fetch('', params, {
      signal: abortController.signal,
    }).then((featureCollection) => featureCollection.features);
  }
}

export default RoutingAPI;
