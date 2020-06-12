import qs from 'query-string';
import {
  translateTrajCollResponse,
  translateTrajStationsResp,
} from './TrajservAPIUtils';
import { handleError, readJsonResponse } from '../utils';

/**
 * Access to Trajserv api.
 * @class
 * @example
 * import { TrajservAPI } from 'mobility-toolbox-js/src/api';
 */
class TrajservAPI {
  constructor(options = {}) {
    this.url = options.url || 'https://api.geops.io/tracker/v1';
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   * @private
   */
  fetch(url, params = {}, config) {
    const urlParams = { ...params, key: this.apiKey };
    return fetch(`${url}?${qs.stringify(urlParams)}`, config).then(
      readJsonResponse,
    );
  }

  /**
   * Fetch a trajectory by id.
   * @param {Object} params Request parameters.
   * @param {AbportController} abortController
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
   * @param {Object} params Request parameters.
   * @param {AbportController} abortController
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
   * Fetch stations information about a trajectory.
   * @param {Object} params Request parameters.
   * @param {AbportController} abortController
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
