import qs from 'query-string';
import {
  translateTrajCollResponse,
  translateTrajStationsResp,
} from './TrajservAPIUtils';
import API from '../../common/api/api';
import FetchTrajectoriesWorker from './fetchTrajectories.worker';

/**
 * Access to the [Realtime service](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/).
 *
 * @example
 * import { TrajservAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new TrajservAPI({
 *   url: 'https://api.geops.io/tracker/v1',
 *   apiKey: [yourApiKey]
 * });
 *
 */
class TrajservAPI extends API {
  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} [options.url='https://api.geops.io/tracker/v1'] Service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   */
  constructor(options = {}) {
    super({ url: 'https://api.geops.io/tracker/v1', ...options });
    this.fetchTrajectoriesWorker = new FetchTrajectoriesWorker();
  }

  /**
   * Fetch a trajectory by id.
   *
   * @param {GetTrajectoryByIdParams} params Request parameters. See [Realtime service documentation](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/#/default/get_trajectorybyid).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<TrajservTrajectory>} A trajectory.
   */
  fetchTrajectoryById(params, abortController = {}) {
    return this.fetch(`/trajectorybyid`, params, {
      signal: abortController.signal,
    });
  }

  /**
   * Fetch trajectories using the worker.
   *
   * @param {GetTrajectoriesParams} params Request parameters. See [Realtime service documentation](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/#/default/get_trajectory_collection).
   * @param {AbortController} abortController Abort controller used to cancel the request.
  //  * @returns {Promise<Trajectory[]>} A list of trajectories.
   */
  // eslint-disable-next-line class-methods-use-this
  fetchTrajectoriesWorkerr(params) {
    // Clean requets parameters, removing undefined and null values.
    const urlParams = { ...params, key: this.apiKey };
    const clone = { ...urlParams };
    Object.keys(urlParams).forEach(
      (key) =>
        (clone[key] === undefined || clone[key] === null) && delete clone[key],
    );
    this.fetchTrajectoriesWorker.postMessage(
      `${this.url}/trajectory_collection?${qs.stringify(clone)}`,
    );
  }

  /**
   * Fetch trajectories.
   *
   * @param {GetTrajectoriesParams} params Request parameters. See [Realtime service documentation](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/#/default/get_trajectory_collection).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<Array<Trajectory>>} A list of trajectories.
   */
  fetchTrajectories(params, abortController = {}) {
    return this.fetch(`/trajectory_collection`, params, {
      signal: abortController.signal,
    }).then((data) => {
      return translateTrajCollResponse(data.features);
    });
  }

  /**
   * Fetch stations informations about a trajectory.
   *
   * @param {GetTrajectoryStationsParams} params Request parameters. See [Realtime service documentation](https://developer.geops.io/apis/5dcbd5c9a256d90001cf1360/#/default/get_trajstations).
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<Array<TrajectoryStation>>} A list of stations.
   */
  fetchTrajectoryStations(params, abortController = {}) {
    return this.fetch(`/trajstations`, params, {
      signal: abortController.signal,
    }).then((data) => {
      return translateTrajStationsResp(data);
    });
  }
}

export default TrajservAPI;
