import HttpAPI from './HttpAPI';

import type { Extent } from 'ol/extent';

import type { MapsetPlan } from '../types';

export interface MapsetAPIOptions {
  apiKey: string;
  bbox?: number[];
  tags?: string[];
  url?: string;
}

export interface MapsetAPIParams {
  bbox?: Extent;
  tags?: string[];
}

/**
 * This class provides convenience methods to use the [geOps Mapset API](https://geops.com/de/solution/mapset).
 *
 * @example
 * import { MapsetAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new MapsetAPI({
 *   // graph: 'osm',
 *   // url: 'https://moco.geops.io/api/v1',
 *   // ssoConfig: "geopstest",
 * });
 *
 * const plans = await api.getPlans();
 *
 * console.log('Log route:', JSON.stringify(plans));
 *
 * @private
 */
class MapsetAPI extends HttpAPI {
  bbox: number[] | undefined = [];
  tags: string[] = [];

  /**
   * Constructor
   *
   * @param {Object} options Options.
   *
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string} [options.url='https://editor.mapset.io/api/v1'] Service url.
   * @param {string[]} [options.tags] Tags.
   * @param {number[]} [options.bbox] Bounding box.
   */
  constructor(options: MapsetAPIOptions) {
    super({
      ...options,
      apiKey: options.apiKey,
      url: options.url || 'https://editor.mapset.io/api/v1',
    });
    this.tags = options.tags || [];
    this.bbox = options.bbox;
  }

  /**
   * Get notifications from the MOCO API.
   * Plans are returned as an array of mapset plan objects with kml strings in data attribute.
   *
   * @param {MapsetAPIParams} params Request parameters.
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<MapsetPlan[]>} An array of mapset plan objects with kml strings in data attribute.
   * @public
   */
  async getPlans(
    params: MapsetAPIParams = {},
    config: RequestInit = {},
  ): Promise<MapsetPlan[]> {
    const apiParams: MapsetAPIParams = { ...params };
    const plans = await this.fetch<MapsetPlan[]>(
      `/plans`,
      {
        bbox: this.bbox?.toString(),
        tags: this.tags?.toString(),
        ...apiParams,
      },
      config,
    );

    return plans;
  }
}

export default MapsetAPI;
