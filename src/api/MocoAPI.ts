import { isMocoNotificationNotOutOfDate } from '../common/utils/mocoUtils';

import HttpAPI from './HttpAPI';

import type { MocoNotification, MocoParameters } from '../types';

export interface MocoAPIOptions {
  apiKey: string;
  graph?: string;
  simplify?: number;
  ssoConfig?: string;
  url?: string;
}

export type MocoParametersExtended = {
  apiKey?: string;
  date?: Date;
  graph?: string;
  sso_config?: string;
} & Omit<MocoParameters, 'apiKey' | 'graph' | 'sso_config'>;

/**
 * This class provides convenience methods to use to the [geOps MOCO API](https://geops.com/de/solution/disruption-information).
 *
 * @example
 * import { MocoAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new MocoAPI({
 *   // graph: 'osm',
 *   // url: 'https://moco.geops.io/api/v1',
 *   // ssoConfig: "geopstest",
 * });
 *
 * const notifications = await api.getNotifications();
 *
 * console.log('Log route:', JSON.stringify(notifications));
 *
 * @private
 */
class MocoAPI extends HttpAPI {
  graph?: string = 'osm';

  simplify?: number = 0; // The backend has 100 as default value, but we use 0 to get the full geometries.

  ssoConfig?: string = 'geopstest';

  /**
   * Constructor
   *
   * @param {Object} options Options.
   *
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string} [options.url='https://moco.geops.io/api/v1'] Service url.
   * @param {string} [options.ssoConfig='geopstest'] SSO config to get notifications from.
   * @param {string} [options.graph='osm'] Graph to use for geometries.
   */
  constructor(options: MocoAPIOptions) {
    super({
      ...options,
      apiKey: options.apiKey,
      url: options.url || 'https://moco.geops.io/api/v1/',
    });

    this.ssoConfig = options.ssoConfig || 'geopstest';
    this.graph = options.graph || 'osm';
    this.simplify = options.simplify || 0;
  }

  /**
   * Get notifications from the MOCO API.
   * Notifications are returned as an array of GeoJSON feature collections.
   *
   * @param {MocoParameters} params Request parameters.
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<MocoNotification[]>} An array of GeoJSON feature collections with coordinates in [EPSG:4326](http://epsg.io/4326).
   * @public
   */
  async getNotifications(
    params: MocoParametersExtended = {},
    config: RequestInit = {},
  ): Promise<MocoNotification[]> {
    const apiParams: MocoParametersExtended = { ...params };
    delete apiParams.date; // Not used in this method
    let notifications = await this.fetch<MocoNotification[]>(
      'export/publication/',
      {
        graph: this.graph || 'osm',
        simplify: this.simplify || 0,
        sso_config: this.ssoConfig || 'geopstest',
        ...apiParams,
      },
      config,
    );

    // TODO in the future we hope that the date parameter will be used by the API to filter out-of-date notifications.
    // For now we filter them out manually.
    const date = params?.date;
    if (date) {
      notifications = notifications.filter((notification) => {
        return isMocoNotificationNotOutOfDate(notification, date);
      });
    }
    return notifications;
  }
}

export default MocoAPI;
