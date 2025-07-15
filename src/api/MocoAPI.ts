import {
  getStartsString,
  isNotificationActive,
  isNotificationNotOutOfDate,
  isNotificationPublished,
} from '../common/utils/mocoUtils';
import {
  MocoNotification,
  MocoNotificationAsFeatureCollection,
  MocoNotificationFeatureProperties,
  MocoNotificationStatusProperties,
} from '../types';
import HttpAPI from './HttpAPI';

export interface MocoAPIOptions {
  graph?: string;
  ssoConfig?: string;
  url?: string;
}

export interface MocoParameters {
  addIconRefFeatures?: boolean;
  addStatusProperties?: boolean;
  date?: Date;
  graph?: string;
  sso_config?: string;
}

/**
 * This class provides convenience methods to use to the [geOps MOCO API](https://geops.com/de/solution/disruption-information).
 *
 * @example
 * import { MocoAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new MocoAPI({
 *   // graph: 'osm',
 *   // url: 'https://moco.geops.io/api/v1',
 *   // ssoConfig: "rvf",
 * });
 *
 * const notifications = await api.getNotifications();
 *
 * console.log('Log route:', JSON.stringify(notifications));
 *
 * @public
 */
class MocoAPI extends HttpAPI {
  graph?: string = 'osm';

  ssoConfig?: string = 'rvf';

  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} [options.url='https://moco.dev.geops.io/api/v1'] Service url.
   * @param {string} [options.ssoConfig='geops'] SSO config to get notifications from.
   * @param {string} [options.graph='osm'] Graph to use for geometries.
   * @public
   */
  constructor(options: MocoAPIOptions = {}) {
    super({
      apiKey: 'public',
      url: 'https://moco.dev.geops.io/api/v1',
      ...options,
    });
  }

  /**
   * Get notifications from the MOCO API.
   *
   * @param {MocoParameters} params Request parameters.
   * @param {FetchOptions} config Options for the fetch request.
   * @return {Promise<MocoNotification[]>} An array of GeoJSON feature collections with coordinates in [EPSG:4326](http://epsg.io/4326).
   * @public
   */
  async getNotifications(
    params: MocoParameters,
    config: RequestInit,
  ): Promise<MocoNotification[]> {
    let notifications = (await this.fetch(
      '/export/publication/',
      {
        graph: this.graph,
        sso_config: this.ssoConfig,
        ...params,
      },
      config,
    )) as MocoNotification[];

    // TODO in the future we hope that the date parameter will be used by the API to filter out-of-date notifications.
    // For now we filter them out manually.
    const date = params?.date;
    if (date) {
      notifications = notifications.filter((notification) => {
        return isNotificationNotOutOfDate(notification, date);
      });
    }

    // TODO: Should those status properties go in the NotificationsLayer? or in the backend?
    // Adds some status properties to the notification to facilitate the rendering on a map
    // if (params?.addStatusProperties) {
    //   notifications = notifications.map((notification) => {
    //     const now = date || new Date();
    //     const isPublished = isNotificationPublished(notification, now);
    //     const isActive = isNotificationActive(notification, now);
    //     const starts = getStartsString(notification, now);

    //     return {
    //       ...notification,
    //       properties: {
    //         ...notification.properties,
    //         isActive,
    //         isPublished,
    //         starts,
    //       },
    //     };
    //   });
    // }

    return notifications;
  }

  /**
   * Get notifications as a unique GeoJSON feature collection.
   * The list of notification are read from the `getNotifications` method
   * then all features are merged into a single GeoJSON feature collection
   * and the notification properties are given to each feature of its notification.
   */
  async getNotificationsAsFeatureCollection(
    params: MocoParameters,
    config: RequestInit,
  ): Promise<MocoNotificationAsFeatureCollection> {
    const notifications = await this.getNotifications(params, config);

    // Merge all features into a single GeoJSON feature collection
    // and add the notification properties to each feature.
    const features = notifications.flatMap((notification) => {
      return notification.features.map((feature) => {
        return {
          ...feature,
          properties: {
            ...notification.properties,
            ...feature.properties,
          },
        };
      });
    });

    return {
      features,
      type: 'FeatureCollection',
    };
  }
}

export default MocoAPI;
