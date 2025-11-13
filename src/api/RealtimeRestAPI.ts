import { type StopsParameters, type StopsResponse } from '../types';

import HttpAPI from './HttpAPI';

import type {
  RealtimeFeedCollection,
  RealtimeRestOperations,
  RealtimeTrainsByRouteIdentifierResult,
  RealtimeTrajectoryCollection,
} from '../types';

export interface RealtimeRestAPIOptions {
  apiKey?: string;
  tenant?: string;
  url?: string;
}

/**
 * This class provides convenience methods to use to the [geOps Realtime REST API](https://developer.geops.io/apis/realtime/).
 * For the websocket see {@link RealtimeAPI}.
 *
 * @example
 * import { RealtimeRestAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RealtimeRestAPI({
 *   apiKey: [yourApiKey],
 *   tenant: 'trenord',
 *   // url: 'https://api.geops.io/tracker-http/v1/',
 * });
 *
 * const feeds = await api.feeds();
 *
 * console.log('Log feeds:', JSON.stringify(feeds));
 *
 */
class RealtimeRestAPI extends HttpAPI {
  tenant?: string;

  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {string} [options.url='https://api.geops.io/tracker-http/v1/'] Url of the [geOps stops API](https://developer.geops.io/apis/realtime/).
   */
  constructor(options: RealtimeRestAPIOptions = {}) {
    super({
      ...options,
      url: options.url || 'https://api.geops.io/tracker-http/v1/',
    });

    if (options.tenant) {
      this.tenant = options.tenant;
    }
  }

  /**
   * Get list of feeds.
   */
  feeds(
    params: Partial<
      RealtimeRestOperations['feeds_feeds__get']['parameters']['query']
    > = {},
    config?: RequestInit,
  ): Promise<RealtimeFeedCollection> {
    return this.fetch<
      RealtimeFeedCollection,
      RealtimeRestOperations['feeds_feeds__get']['parameters']['query']
    >('feeds', params, config);
  }

  /**
   * Search for trains by route identifier.
   */
  trainsByRouteIdentifier(
    params: RealtimeRestOperations['trains_by_route_identifier_trains_by_route_identifier__feed_name___get']['parameters']['query'] = {
      exact_match: true,
    },
    config?: RequestInit,
  ): Promise<RealtimeTrainsByRouteIdentifierResult> {
    return this.fetch<
      RealtimeTrainsByRouteIdentifierResult,
      RealtimeRestOperations['trains_by_route_identifier_trains_by_route_identifier__feed_name___get']['parameters']['query']
    >(`trains_by_route_identifier/${this.tenant}`, params, config);
  }

  /**
   * Get trajectories for a tenant.
   */
  trajectories(
    params: Partial<
      RealtimeRestOperations['trajectories_trajectories__feed_name___get']['parameters']['query']
    > = {},
    config?: RequestInit,
  ): Promise<RealtimeTrajectoryCollection> {
    return this.fetch<
      RealtimeTrajectoryCollection,
      RealtimeRestOperations['trajectories_trajectories__feed_name___get']['parameters']['query']
    >(`trajectories/${this.tenant}`, params, config);
  }
}

export default RealtimeRestAPI;
