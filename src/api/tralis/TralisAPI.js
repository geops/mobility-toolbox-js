import WebSocketConnector from './WebSocketConnector';
import {
  getModeSuffix,
  cleanStopTime,
  compareDepartures,
} from './TralisAPIUtils';

/**
 * Enum for Tralis modes.
 * @readonly
 * @typedef {string} TralisMode
 * @property {string} RAW "raw"
 * @property {string} SCHEMATIC "schematic"
 * @property {string} TOPOGRAPHIC "topographic"
 * @enum {TralisMode}
 */
export const TralisModes = {
  RAW: 'raw',
  TOPOGRAPHIC: 'topographic',
  SCHEMATIC: 'schematic',
};

/**
 * Access to Tralis service.
 *
 * @example
 * import { TralisAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new TralisAPI({
 *   url: "yourUrl",
 *   apiKey: "yourApiKey"
 * });
 *
 * @example
 * import { TralisAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new TralisAPI("yourUrl");
 */
class TralisAPI {
  /**
   * Constructor
   *
   * @param {Object|string} options A string representing the url of the service or an object containing the url and the apiKey.
   * @param {string} options.url Service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   * @param {string} [options.prefix=''] Service prefix to specify tenant.
   * @param {string} [options.projection='epsg:3857'] The epsg code of the projection for features.
   * @param {number[4]} [options.bbox=[minX, minY, maxX, maxY] The bounding box to receive data from.
   */
  constructor(options = {}) {
    let wsUrl = null;

    if (typeof options === 'string') {
      wsUrl = options;
    } else {
      wsUrl = options.url;
    }

    if (options.apiKey) {
      wsUrl = `${wsUrl}?key=${options.apiKey}`;
    }

    /** @ignore */
    this.subscribedStationUic = null;

    /** @ignore */
    this.departureUpdateTimeout = null;

    /** @ignore */
    this.maxDepartureAge = 30;

    /** @ignore */
    this.extraGeoms = {};

    /** @ignore */
    this.prefix = options.prefix || '';

    /** @ignore */
    this.conn = new WebSocketConnector(wsUrl);
    this.conn.setProjection(options.projection || 'epsg:3857');

    if (options.bbox) {
      this.conn.setBbox(options.bbox);
    }
  }

  /**
   * Subscribe to a channel.
   *
   * @param {string} channel Name of the websocket channel to subscribe.
   * @param {function} onSuccess Callback when the subscription succeeds.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @private
   */
  subscribe(channel, onSuccess, onError, quiet = false) {
    this.conn.subscribe({ channel }, onSuccess, onError, quiet);
  }

  /**
   * Unsubscribe to a channel.
   *
   * @param {string} channel Name of the websocket channel to unsubscribe.
   * @param {string} [suffix=''] Suffix to add to the channel name.
   * @private
   */
  unsubscribe(channel, suffix = '') {
    this.conn.unsubscribe(
      `${channel}${getModeSuffix(TralisModes.SCHEMATIC, TralisModes)}${suffix}`,
    );
    this.conn.unsubscribe(
      `${channel}${getModeSuffix(
        TralisModes.TOPOGRAPHIC,
        TralisModes,
      )}${suffix}`,
    );
  }

  /**
   * Filter departures and return an array.
   *
   * @param {Object} depObject The object containing departures by id.
   * @param {boolean} [sortByMinArrivalTime=false] If true sort departures by arrival time.
   * @returns {Array<departure>} Return departures array.
   * @private
   */
  filterDepartures(depObject, sortByMinArrivalTime = false) {
    const departures = Object.keys(depObject).map((k) => depObject[k]);
    departures.sort((a, b) => compareDepartures(a, b, sortByMinArrivalTime));

    let future = new Date();
    future.setMinutes(future.getMinutes() + this.maxDepartureAge);
    future = future.getTime();

    let past = new Date();
    past.setMinutes(past.getMinutes() - this.maxDepartureAge);
    past = past.getTime();

    const departureArray = [];
    const platformsBoarding = [];
    let previousDeparture = null;

    for (let i = departures.length - 1; i >= 0; i -= 1) {
      const d = departures[i];
      const t = new Date(d.time).getTime();

      // Only show departures within the next 30 minutes
      if (t > past && t < future) {
        // If 2 trains are boarding at the same platform,
        // remove the older one.
        if (d.state === 'BOARDING') {
          if (platformsBoarding.indexOf(d.platform) === -1) {
            platformsBoarding.push(d.platform);
          } else {
            d.state = 'HIDDEN';
          }
        }

        // If two trains with the same line number and destinatin
        // and a departure difference < 1 minute, hide the second one.
        if (
          previousDeparture &&
          d.to[0] === previousDeparture.to[0] &&
          Math.abs(t - previousDeparture.time) < 1000 &&
          d.line.name === previousDeparture.line.name
        ) {
          d.state = 'HIDDEN';
        }

        if (/(STOP_CANCELLED|JOURNEY_CANCELLED)/.test(d.state)) {
          d.cancelled = true;
        }

        previousDeparture = d;
        previousDeparture.time = t;
        departureArray.unshift(d);
      }
    }

    return departureArray;
  }

  /**
   * Subscribe to departures channel of a given station.
   *
   * @param {number} stationId UIC of the station.
   * @param {Boolean} sortByMinArrivalTime Sort by minimum arrival time
   * @param {function(departures:Departure[])} onMessage Function called on each message of the channel.
   */
  subscribeDepartures(stationId, sortByMinArrivalTime = false, onMessage) {
    window.clearTimeout(this.departureUpdateTimeout);
    this.unsubscribeDepartures();
    this.subscribedStationUic = stationId;
    const channel = stationId ? `timetable_${stationId}` : null;
    const departureObject = {};
    this.subscribe(
      channel,
      (data) => {
        if (data.source === channel) {
          const content = data.content || {};
          const tDiff = new Date(content.timestamp).getTime() - Date.now();
          content.timediff = tDiff;
          departureObject[content.call_id] = content;

          window.clearTimeout(this.departureUpdateTimeout);
          this.departureUpdateTimeout = window.setTimeout(() => {
            const departures = this.filterDepartures(
              departureObject,
              sortByMinArrivalTime,
            );
            onMessage(departures);
          }, 100);
        }
      },
      () => {
        onMessage([]);
      },
    );
  }

  /**
   * Unsubscribe from current departures channel.
   */
  unsubscribeDepartures() {
    if (this.subscribedStationUic) {
      this.unsubscribe(`timetable_${this.subscribedStationUic}`);
      this.subscribedStationUic = null;
    }
  }

  /**
   * Subscribe to the disruptions channel for tenant.
   *
   * @param {function} onMessage Function called on each message of the channel.
   */
  subscribeDisruptions(onMessage) {
    this.subscribe(`${this.prefix}newsticker`, (data) => {
      onMessage(data.content);
    });
  }

  /**
   * Unsubscribe disruptions.
   */
  unsubscribeDisruptions() {
    this.unsubscribe(`${this.prefix}newsticker`);
  }

  /**
   * Return a station with a given uic number and a mode.
   *
   * @param {number} uic UIC of the station.
   * @param {TralisMode} mode Tralis mode.
   * @returns {Promise<Station>} A station.
   */
  getStation(uic, mode) {
    const params = {
      channel: `station${getModeSuffix(mode, TralisModes)}`,
      args: uic,
    };

    return new Promise((resolve, reject) => {
      this.conn.get(params, (data) => {
        if (data.content) {
          resolve(data.content);
        } else {
          reject();
        }
      });
    });
  }

  /**
   * Update the model's station list for a given mode and a bbox.
   *
   * @param {TralisMode} mode Tralis mode.
   * @param {number[4]} bbox The extent where to request.
   * @returns {Promise<Station[]>} An array of stations.
   */
  getStations(mode, bbox) {
    const stations = [];
    if (bbox) {
      this.conn.setBbox(bbox);
    }
    const params = {
      channel: `station${getModeSuffix(mode, TralisModes)}`,
    };
    window.clearTimeout(this.stationUpdateTimeout);
    return new Promise((resolve, reject) => {
      this.conn.get(params, (data) => {
        if (data.content) {
          stations.push(data.content);
          window.clearTimeout(this.stationUpdateTimeout);
          /** @ignore */
          this.stationUpdateTimeout = window.setTimeout(() => {
            resolve(stations);
          }, 50);
        } else {
          reject(data.content);
        }
      });
    });
  }

  /**
   * Subscribe to stations channel.
   * One message pro station.
   *
   * @param {TralisMode} mode Tralis mode.
   * @param {number[4]} bbox The extent where to request.
   * @param {function(station: Station)} onMessage Function called on each message of the channel.
   */
  subscribeStations(mode, bbox, onMessage) {
    this.unsubscribeStations();
    if (bbox) {
      this.conn.setBbox(bbox);
    }
    this.subscribe(`station${getModeSuffix(mode, TralisModes)}`, (data) => {
      if (data.content) {
        onMessage(data.content);
      }
    });
  }

  /**
   * Unsubscribe to stations channel.
   */
  unsubscribeStations() {
    window.clearTimeout(this.stationUpdateTimeout);
    this.unsubscribe('station');
  }

  /**
   * Subscribe to extra_geoms channel.
   *
   * @param {function(extraGeoms: GeosJSONFeature[])} onMessage Function called on each message of the channel.
   */
  subscribeExtraGeoms(onMessage) {
    this.subscribe('extra_geoms', (data) => {
      const extraGeom = data.content;

      if (extraGeom) {
        const { ref } = extraGeom.properties;

        if (extraGeom.type === 'Feature') {
          this.extraGeoms[ref] = extraGeom;
        } else {
          delete this.extraGeoms[ref];
        }

        onMessage(
          Object.keys(this.extraGeoms).map((key) => this.extraGeoms[key]),
        );
      }
    });
  }

  /**
   * Unsubscribe to extra_geoms channel.
   */
  unsubscribeExtraGeoms() {
    this.unsubscribe('extra_geoms');
  }

  /**
   * Subscribe to trajectory channel.
   *
   * @param {TralisMode} mode Tralis mode.
   * @param {function(trajectory: TralisTrajectory)} onMessage Function called on each message of the channel.
   */
  subscribeTrajectory(mode, onMessage) {
    this.unsubscribeTrajectory();
    this.subscribe(`trajectory${getModeSuffix(mode, TralisModes)}`, onMessage);
  }

  /**
   * Unsubscribe to trajectory channels.
   */
  unsubscribeTrajectory() {
    this.unsubscribe(`trajectory`);
  }

  /**
   * Subscribe to deleted_vhicles channel.
   *
   * @param {TralisMode} mode Tralis mode.
   * @param {function(response: { content: Vehicle })} onMessage Function called on each message of the channel.
   */
  subscribeDeletedVehicles(mode, onMessage) {
    this.unsubscribeDeletedVehicles();
    this.subscribe(
      `deleted_vehicles${getModeSuffix(mode, TralisModes)}`,
      onMessage,
    );
  }

  /**
   * Unsubscribe to deleted_vhicles channels.
   */
  unsubscribeDeletedVehicles() {
    this.unsubscribe('deleted_vehicles');
  }

  /**
   * Get a full trajectory of a vehicule .
   *
   * @param {number} id A vehicle id.
   * @param {TralisMode} mode Tralis mode.
   * @returns {Promise<FullTrajectory>} Return a full trajectory.
   */
  getFullTrajectory(id, mode) {
    const params = {
      channel: `full_trajectory${getModeSuffix(mode, TralisModes)}_${id}`,
    };

    return new Promise((resolve) => {
      this.conn.get(params, (data) => {
        if (data.content) {
          resolve(data.content);
        }
      });
    });
  }

  /**
   * Get full trajectories of a vehicules .
   *
   * @param {number[]} ids List of vehicles ids.
   * @param {TralisMode} mode Tralis mode.
   * @returns {Promise<FullTrajectory[]>} Return an array of full trajectories.
   */
  getFullTrajectories(ids, mode) {
    const promises = ids.map((id) => {
      return this.getFullTrajectory(id, mode);
    });
    return Promise.all(promises);
  }

  /**
   * Subscribe to full_trajectory channel of a given vehicle.
   *
   * @param {number} id A vehicle id.
   * @param {TralisMode} mode Tralis mode.
   */
  subscribeFullTrajectory(id, mode) {
    // window.clearTimeout(this.fullTrajectoryUpdateTimeout);
    this.unsubscribeFullTrajectory(id);
    this.subscribe(
      `full_trajectory${getModeSuffix(mode, TralisModes)}_${id}`,
      (data) => {
        // eslint-disable-next-line no-console
        console.log('subscribe full_trajectory', data);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.log('subscribe full_trajectory error', err);
      },
    );
  }

  /**
   * Unsubscribe from full_trajectory channel
   *
   * @param {number} id A vehicle id.
   */
  unsubscribeFullTrajectory(id) {
    this.unsubscribe('full_trajectory', `_${id}`);
  }

  /**
   * Get the list of stops for this vehicle.
   *
   * @param {number} id A vehicle id.
   * @returns {Promise<StopSequence>} Returns a stop sequence object.
   */
  getStopSequence(id) {
    const params = {
      channel: `stopsequence_${id}`,
    };
    return new Promise((resolve, reject) => {
      this.conn.get(
        params,
        (data) => {
          // Remove the delay from arrivalTime nad departureTime
          resolve(cleanStopTime(data.content && data.content[0]));
        },
        (err) => {
          reject(err);
        },
      );
    });
  }

  /**
   * Get a list of stops for a list of vehicles.
   *
   * @param {number[]} ids List of vehicles ids.
   * @returns {Promise<StopSequence[]>} Return an array of stop sequences.
   */
  getStopSequences(ids) {
    const promises = ids.map((id) => {
      return this.getStopSequence(id);
    });
    return Promise.all(promises);
  }

  /**
   * Subscribe to stopsequence channel of a given vehicle.
   *
   * @param {number} id A vehicle id.
   * @param {function(stopSequence: StopSequence)} onMessage Function called on each message of the channel.
   */
  subscribeStopSequence(id, onMessage) {
    window.clearTimeout(this.fullTrajectoryUpdateTimeout);
    this.unsubscribeStopSequence(id);

    this.subscribe(
      `stopsequence_${id}`,
      (data) => {
        // Remove the delay from arrivalTime nad departureTime
        onMessage(cleanStopTime(data.content && data.content[0]));
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.log('subscribe stopsequence error', err);
      },
    );
  }

  /**
   * Unsubscribe from stopsequence channel
   *
   * @param {number} id A vehicle id.
   */
  unsubscribeStopSequence(id) {
    this.unsubscribe(`stopsequence`, `_${id}`);
  }

  /**
   * Subscribe to healthcheck channel.
   * @param {function} onMessage Callback when the subscribe to healthcheck channel succeeds.
   */
  subscribeHealthCheck(onMessage) {
    this.unsubscribeHealthCheck();
    this.subscribe('healthcheck', onMessage);
  }

  /**
   * Unsubscribe to healthcheck channel.
   */
  unsubscribeHealthCheck() {
    this.unsubscribe('healthcheck');
  }
}
export default TralisAPI;
