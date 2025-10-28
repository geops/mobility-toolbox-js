import HttpAPI from './HttpAPI';

import type { MocoExportByIdParameters, MocoExportParameters } from '../types';
import type {
  SituationType,
  SituationTypeExtendedOffsetPaginated,
} from '../types';

export interface MocoAPIOptions {
  apiKey: string;
  graph?: string;
  tenant?: string;
  url?: string;
}

/**
 * This class provides convenience methods to use to the [geOps MOCO API](https://geops.com/de/solution/disruption-information).
 *
 * @example
 * import { MocoAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new MocoAPI({
 *   // url: 'https://moco.geops.io/api/v2/',
 *   // tenant: "geopstest",
 * });
 *
 * const notifications = await api.export();
 *
 * console.log('Log route:', JSON.stringify(notifications));
 *
 * @private
 */
class MocoAPI extends HttpAPI {
  tenant = 'geopstest';

  /**
   * Constructor
   *
   * @param {Object} options Options.
   *
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string} [options.url='https://moco.geops.io/api/v2/'] Service url.
   * @param {string} [options.tenant='geopstest'] SSO config to get notifications from.
   */
  constructor(options: MocoAPIOptions) {
    super({
      ...options,
      url: options.url || 'https://moco.geops.io/api/v2/',
    });

    if (options.tenant) {
      this.tenant = options.tenant;
    }
  }

  /**
   * Get paginated situations.
   */
  async export(
    params: MocoExportParameters = {},
    config: RequestInit = {},
  ): Promise<{ paginatedSituations: SituationTypeExtendedOffsetPaginated }> {
    const response = await this.fetch<
      { paginatedSituations: SituationTypeExtendedOffsetPaginated },
      MocoExportParameters
    >(
      `${this.tenant}/export/`,
      {
        ...params,
      },
      config,
    );

    return response;
  }

  /**
   * Get a situation. Not all parameters are
   * relevant, only the text related are useful
   * (contentXXX, de, fr, it, en, includeXXX).
   */
  async exportById(
    id: string,
    params: MocoExportByIdParameters = {},
    config: RequestInit = {},
  ): Promise<SituationType> {
    const response = await this.fetch<
      { paginatedSituations: SituationTypeExtendedOffsetPaginated },
      MocoExportByIdParameters
    >(`${this.tenant}/export/${id}`, params, config);
    return response?.paginatedSituations?.results?.[0];
  }
}

export default MocoAPI;
