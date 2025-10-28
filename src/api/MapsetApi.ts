import HttpAPI from './HttpAPI';

/**
 * @typedef {Object} MapsetPlan
 * @property {string} admin_id Plan identifier for read/write access.
 * @property {string} read_id Plan identifier for read access.
 * @property {string} data The plan KML data as string.
 * @property {created_at} string Creation timestamp.
 * @property {modified_at} string Last modification timestamp.
 * @property {string} queryparams The query string used to load the plan in Mapset Editor.
 * @public
 */
export interface MapsetPlan {
  admin_id: string;
  created_at: string;
  data: string;
  modified_at: string;
  queryparams: string;
  read_id: string;
}

export interface MapsetAPIOptions {
  apiKey: string;
  tags?: string[];
  tenants?: string[];
  url?: string;
}

/**
 * Parameters for the Mapset getPlans request.
 *
 * @typedef {Object} MapsetGetPlansParameters
 * @property {string[]} bbox Bounding box to search in, in the format "[minLon,minLat,maxLon,maxLat]" (e.g. "[8.5,47.3,8.6,47.4]").
 * @property {string} [key] Access key for [geOps apis](https://developer.geops.io/).
 * @property {string[]} [tags] Array of tags to filter plans.
 * @property {string[]} [tenants] Array of tenants to filter plans.
 * @property {string} [timestamp] ISO 8601 timestamp to get the plans at a specific time (e.g. "2023-01-01T12:00:00Z").
 * @property {number} zoom Zoom level to filter plans.
 * @public
 */
export interface MapsetGetPlansParameters {
  bbox: string;
  key?: string;
  tags?: string;
  tenants?: string;
  timestamp?: string;
  zoom: number;
}

export interface MapsetGetPlansResponse {
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
 *   apiKey: 'yourApiKey',
 *   // tenants: ['geopstest'],
 *   // url: 'https://editor.mapset.io/api/v1',
 * });
 *
 * const plans = await api.getPlans({
 *   bbox: [8.5, 47.3, 8.6, 47.4],
 *   zoom: 10,
 *   // timestamp: (new Date()).toISOString(),
 * });
 *
 * console.log('Log route:', JSON.stringify(plans));
 *
 * @public
 */
class MapsetAPI extends HttpAPI {
  tags: string[] = [];
  tenants: string[] = [];

  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string[]} [options.tags] Array of tags to filter plans.
   * @param {string[]} [options.tenants=["geopstest"]] Array of tenants to filter plans.
   * @param {string} [options.url='https://editor.mapset.io/api/v1/'] Url of the [geOps Mapset API](https://geops.com/de/solution/mapset).
   */
  constructor(options: MapsetAPIOptions) {
    super({
      ...options,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      url: options.url || 'https://editor.mapset.io/api/v1/',
    });
    this.tags = options.tags ?? [];
    this.tenants = options.tenants ?? ['geopstest'];
  }

  /**
   * Get single mapset plan by ID.
   *
   * @param {string} id  Mapset Plan identifier.
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<MapsetPlan>} A mapset plan.
   * @public
   */
  async getPlanById(id: string, config: RequestInit = {}): Promise<MapsetPlan> {
    return await this.fetch<MapsetPlan, Record<string, string | undefined>>(
      `meta/kml/${id}/`,
      {},
      { method: 'GET', ...config },
    );
  }

  /**
   * Get a list of mapset plans.
   *
   * @param {MapsetGetPlansParameters} params Request parameters.
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<MapsetPlan[]>} An array of mapset plan objects with kml strings in data attribute.
   * @public
   */
  async getPlans(
    params: MapsetGetPlansParameters,
    config: RequestInit = {},
  ): Promise<MapsetPlan[]> {
    const res = await this.fetch<
      MapsetGetPlansResponse,
      MapsetGetPlansParameters
    >(
      'export/kml/',
      {
        key: this.apiKey,
        tags: this.tags?.toString(),
        tenants: this.tenants?.toString(),
        ...(params || {}),
      },
      config,
    );

    if (res?.detail) {
      throw new Error(res.detail);
    }

    return res?.results || [];
  }
}

export default MapsetAPI;
