import HttpAPI from './HttpAPI';
export interface MapsetPlan {
  admin_id: string;
  created_at: string;
  data: string;
  modified_at: string;
  queryparams: string;
  read_id: string;
}

export interface MapsetAPIOptions {
  apiKey?: string;
  bbox?: number[];
  tags?: string[];
  tenants?: string[];
  timestamp?: string;
  url?: string;
  zoom?: number;
}

export interface MapsetAPIParams {
  bbox?: string;
  key?: string;
  tags?: string;
  tenants?: string;
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
 *   zoom: 10,
 *   url: 'https://editor.mapset.io/api/v1',
 *   tenants: ['geopstest'],
 *   bbox: [8.5, 47.3, 8.6, 47.4],
 *   tags: ['hiking', 'biking'],
 *   apiKey: 'yourApiKey',
 * });
 *
 * const plans = await api.getPlans();
 *
 * console.log('Log route:', JSON.stringify(plans));
 *
 * @public
 */
class MapsetAPI extends HttpAPI {
  bbox: number[] | undefined = [];
  tags: string[] = [];
  tenants: string[] = [];
  timestamp: string | undefined = undefined;
  zoom;

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
      url: options.url ?? 'https://editor.mapset.io/api/v1',
      ...options,
    });
    this.tags = options.tags ?? [];
    this.bbox = options.bbox;
    this.zoom = options.zoom;
    this.tenants = options.tenants ?? [];
    this.timestamp = options.timestamp;
    this.apiKey = options.apiKey ?? '';
  }

  /**
   * Get single mapset plan by ID from the Mapset API.
   *
   * @param {string} ID Plan ID.
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<MapsetApiResponse>} An array of mapset plan objects with kml strings in data attribute.
   * @public
   */
  async getPlanById(id: string, config: RequestInit = {}): Promise<MapsetPlan> {
    return await this.fetch<MapsetPlan, Record<string, string | undefined>>(
      `/meta/kml/${id}`,
      {},
      { method: 'GET', ...config },
    );
  }

  /**
   * Get multiple mapset plans from the Mapset API.
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

    res = await this.fetch<MapsetApiResponse, MapsetAPIParams>(
      '/export/kml/',
      {
        bbox: this.bbox?.toString(),
        key: this.apiKey,
        tags: this.tags?.toString(),
        tenants: this.tenants?.toString(),
        timestamp: this.timestamp,
        zoom: this.zoom && Math.floor(this.zoom),
        ...apiParams,
      },
      config,
    );

    if (res?.detail) {
      console.error('Error fetching mapset plans:', res.detail);
      throw new Error(res.detail);
    }

    return res?.results || [];
  }
}

export default MapsetAPI;
