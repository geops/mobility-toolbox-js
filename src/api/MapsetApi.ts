import HttpAPI from './HttpAPI';

import type { Extent } from 'ol/extent';

import type { MapsetPlan } from '../types';

export interface MapsetAPIOptions {
  apiKey: string;
  bbox?: number[];
  tags?: string[];
  tenants?: string[];
  timestamp?: string;
  url?: string;
  zoom?: number;
}

export interface MapsetAPIParams {
  bbox?: Extent;
  tags?: string[];
  tenants?: string[];
  timestamp?: string;
  zoom?: number;
}

export interface MapsetApiResponse {
  count: number;
  detail?: string;
  next: null | string;
  previous: null | string;
  results: MapsetPlan[];
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
  tenants: string[] = [];
  timestamp: string | undefined = undefined;
  zoom = 1;

  /**
   * Constructor
   *
   * @param {Object} options Options.
   *
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string} [options.url='https://editor.mapset.io/api/v1'] Service url.
   * @param {string[]} [options.tags] Tags.
   * @param {string[]} [options.tenants] Tenants.
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
    this.zoom = options.zoom || 1;
    this.tenants = options.tenants || [];
    this.timestamp = options.timestamp;
  }

  /**
   * Get notifications from the MOCO API.
   * Plans are returned as an array of mapset plan objects with kml strings in data attribute.
   *
   * @param {MapsetAPIParams} params Request parameters.
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<MapsetApiResponse>} An array of mapset plan objects with kml strings in data attribute.
   * @public
   */
  async getPlans(
    params: MapsetAPIParams = {},
    config: RequestInit = {},
  ): Promise<MapsetPlan[]> {
    const apiParams: MapsetAPIParams = { ...params };
    let res = {} as MapsetApiResponse;
    res = await this.fetch<MapsetApiResponse>(
      '/plan_editor/kml',
      {
        bbox: this.bbox?.toString(),
        tags: this.tags?.toString(),
        tenants: this.tenants?.toString(),
        timestamp: this.timestamp,
        zoom: this.zoom.toFixed(0),
        ...apiParams,
      },
      config,
    );

    if (res.detail) {
      console.error('Error fetching mapset plans:', res.detail);
      throw new Error(res.detail);
    }

    return res.results || [];
  }
}

export default MapsetAPI;
