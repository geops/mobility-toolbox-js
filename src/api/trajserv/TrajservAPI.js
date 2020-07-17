import qs from 'query-string';
import {
  translateTrajCollResponse,
  translateTrajStationsResp,
} from './TrajservAPIUtils';
import { handleError, readJsonResponse } from '../utils';

/**
 * Access to the [Realtime service](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/).
 *
 * @example
 * import { TrajservAPI } from 'mobility-toolbox-js/src/api';
 *
 * const api = new TrajservAPI({
 *   url: 'https://api.geops.io/tracker/v1',
 *   apiKey: [yourApiKey]
 * });
 *
 * @classproperty {string} url Url of the service.
 * @classproperty {string} apiKey Api key to access the service.
 */
class TrajservAPI {
  /**
   * @private
   */
  constructor(options = {}) {
    /** @ignore */
    this.url = options.url || 'https://api.geops.io/tracker/v1';
    /** @ignore */
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   * @ignore
   */
  fetch(url, params = {}, config) {
    const urlParams = { ...params, key: this.apiKey };
    return fetch(`${url}?${qs.stringify(urlParams)}`, config).then(
      readJsonResponse,
    );
  }

  /**
   * Fetch a trajectory by id.
   *
   * @param {Object} params Request parameters. See [Realtime service documentation](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/#/default/get_trajectorybyid).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<Object>} A trajectory.
   */
  fetchTrajectoryById(params, abortController = {}) {
    return this.fetch(`${this.url}/trajectorybyid`, params, {
      signal: abortController.signal,
    }).catch((err) => {
      handleError('trajectorybyid', err);
    });
  }

  /**
   * Fetch trajectories.
   *
   * @param {Object} params Request parameters. See [Realtime service documentation](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/#/default/get_trajectory_collection).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<Trajectory[]>} A list of trajectories.
   */
  fetchTrajectories(params, abortController = {}) {
    return this.fetch(`${this.url}/trajectory_collection`, params, {
      signal: abortController.signal,
    })
      .then((data) => {
        if (!data) {
          return [];
        }
        return translateTrajCollResponse(data.features);
      })
      .catch((err) => {
        handleError('trajectory_collection', err);
      });
  }

  /**
   * Fetch stations informations about a trajectory.
   *
   * @param {Object} params Request parameters. See [Realtime service documentation](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/#/default/get_trajstations).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<TrajStation[]>} A list of stations.
   */
  fetchTrajectoryStations(params, abortController = {}) {
    return this.fetch(`${this.url}/trajstations`, params, {
      signal: abortController.signal,
    })
      .then((data) => {
        return translateTrajStationsResp(data);
      })
      .catch((err) => {
        handleError('trajstations', err);
      });
  }
}

export default TrajservAPI;
