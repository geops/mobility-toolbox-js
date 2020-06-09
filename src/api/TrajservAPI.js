import qs from 'query-string';
import {
  translateTrajCollResponse,
  translateTrajStationsResp,
} from './TrajservAPIUtils';

class TrajservAPI {
  /**
   * Display log message on error.
   * @private
   */
  static handleError(reqType, err) {
    if (err.name === 'AbortError') {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(`Fetch ${reqType} request failed: `, err);
  }

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
    return fetch(`${url}?${qs.stringify(urlParams)}`, config);
  }

  /**
   * Fetch a trajectory by id.
   * @param {Object} params Request parameters.
   * @param {AbportController} abortController
   */
  fetchTrajectoryById(params, abortController = {}) {
    return this.fetch(`${this.url}/trajectorybyid`, params, {
      signal: abortController.signal,
    })
      .then((res) => {
        try {
          return res.json();
        } catch (err) {
          throw new Error(err);
        }
      })
      .catch((err) => {
        TrajservAPI.handleError('trajectorybyid', err);
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
      .then((data) => data.json())
      .then((data) => {
        if (!data) {
          return [];
        }
        return translateTrajCollResponse(data.features);
      })
      .catch((err) => {
        TrajservAPI.handleError('trajectory_collection', err);
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
      .then((response) => {
        try {
          return response.json();
        } catch (err) {
          throw new Error(err);
        }
      })
      .then((data) => {
        return translateTrajStationsResp(data);
      })
      .catch((err) => {
        TrajservAPI.handleError('trajstations', err);
      });
  }
}

export default TrajservAPI;
