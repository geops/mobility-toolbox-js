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
 * This class provides convenience methods to access to the [geOps realtime api](https://developer.geops.io/apis/realtime/).
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
   * @param {string} options.url Url to the [geOps realtime api](https://developer.geops.io/apis/realtime/).
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {string} [options.prefix=''] Service prefix to specify tenant.
   * @param {string} [options.projection] The epsg code of the projection for features. Default to EPSG:3857.
   * @param {number[4]} [options.bbox=[minX, minY, maxX, maxY, zoom, tenant] The bounding box to receive data from.
   */
  constructor(options = {}) {
    this.defineProperties(options);

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
    this.onOpen = this.onOpen.bind(this);
  }

  defineProperties(options) {
    let opt = options;

    if (typeof options === 'string') {
      opt = { url: options };
    }

    const { apiKey } = opt;
    let { url, projection, bbox } = opt;
    const conn = new WebSocketConnector();

    if (apiKey) {
      url = `${url || 'wss://tralis-tracker-api.geops.io/ws'}?key=${apiKey}`;
    }

    Object.defineProperties(this, {
      url: {
        get: () => url,
        set: (newUrl) => {
          url = newUrl;
          this.open();
        },
      },
      projection: {
        get: () => projection,
        set: (newProjection) => {
          if (newProjection !== projection) {
            projection = newProjection;
            if (this.conn) {
              this.conn.send(`PROJECTION ${projection}`);
            }
          }
        },
      },
      bbox: {
        get: () => bbox,
        set: (newBbox) => {
          if (JSON.stringify(newBbox) !== JSON.stringify(bbox)) {
            bbox = newBbox;
            if (this.conn) {
              this.conn.send(`BBOX ${bbox.join(' ')}`);
            }
          }
        },
      },
      /**
       * The websocket helper class to connect the websocket.
       *
       * @private
       */
      conn: {
        value: conn,
        writable: true,
      },
      /**
       * Interval between PING request in ms.
       * If equal to 0,  no PING request are sent.
       * @type {number}
       * @private
       */
      pingIntervalMs: {
        value: options.pingIntervalMs || 10000,
        writable: true,
      },
      /**
       * Timeout in ms after an automatic reconnection when the websoscket has been closed by the server.
       * @type {number}
       */
      reconnectTimeoutMs: {
        value: options.pingIntervalMs || 100,
        writable: true,
      },
    });
  }

  open() {
    this.close();
    // Register BBOX and PROJECTION messages must be send before previous subscriptions.
    this.conn.connect(this.url, this.onOpen);

    // Register reconnection on close.
    this.conn.websocket.onclose = () => {
      this.onClose();
    };
  }

  /**
   * Close the websocket connection without reconnection.
   */
  close() {
    this.conn.close();
  }

  /**
   * Unsubscribe trajectory and deleted_vehicles channels. To resubscribe you have to set a new BBOX.
   */
  // eslint-disable-next-line class-methods-use-this
  reset() {
    this.conn.send('RESET');
  }

  /**
   * Callback when the websocket is opened and ready.
   * It applies the bbox and the projection.
   */
  onOpen() {
    if (this.projection) {
      this.conn.send(`PROJECTION ${this.projection}`);
    }
    if (this.bbox) {
      this.conn.send(`BBOX ${this.bbox.join(' ')}`);
    }

    /**
     * Keep websocket alive
     */
    if (this.pingIntervalMs) {
      window.clearInterval(this.pingInterval);
      /** @ignore */
      this.pingInterval = setInterval(() => {
        this.conn.send('PING');
      }, this.pingIntervalMs);
    }
  }

  /**
   * Callback when the websocket is closed by the server.
   * It auto reconnects after a timeout.
   */
  onClose() {
    window.clearTimeout(this.pingInterval);
    window.clearTimeout(this.reconnectTimeout);

    if (this.reconnectTimeoutMs) {
      /** @ignore */
      this.reconnectTimeout = window.setTimeout(
        () => this.open(),
        this.reconnectTimeoutMs,
      );
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
   * Unsubscribe both modes of a channel.
   *
   * @param {string} channel Name of the websocket channel to unsubscribe.
   * @param {string} suffix Suffix to add to the channel name.
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @private
   */
  unsubscribe(channel, suffix, cb) {
    this.conn.unsubscribe(
      `${channel}${getModeSuffix(TralisModes.SCHEMATIC, TralisModes)}${suffix}`,
      cb,
    );
    this.conn.unsubscribe(
      `${channel}${getModeSuffix(TralisModes.TOPOGRAPHIC, TralisModes)}${
        suffix || ''
      }`,
      cb,
    );
  }

  /**
   * Filter departures and return an array.
   *
   * @param {Object} depObject The object containing departures by id.
   * @param {boolean} [sortByMinArrivalTime=false] If true sort departures by arrival time.
   * @return {Array<departure>} Return departures array.
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
  subscribeDepartures(stationId, sortByMinArrivalTime, onMessage) {
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
              sortByMinArrivalTime || false,
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
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDepartures(cb) {
    if (this.subscribedStationUic) {
      this.unsubscribe(`timetable_${this.subscribedStationUic}`, '', cb);
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
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDisruptions(cb) {
    this.unsubscribe(`${this.prefix}newsticker`, '', cb);
  }

  /**
   * Return a station with a given uic number and a mode.
   *
   * @param {number} uic UIC of the station.
   * @param {TralisMode} mode Tralis mode.
   * @return {Promise<Station>} A station.
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
   * @return {Promise<Array<Station>>} An array of stations.
   */
  getStations(mode) {
    const stations = [];
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
   * @param {function(station: Station)} onMessage Function called on each message of the channel.
   */
  subscribeStations(mode, onMessage) {
    this.unsubscribeStations();
    this.subscribe(`station${getModeSuffix(mode, TralisModes)}`, (data) => {
      if (data.content) {
        onMessage(data.content);
      }
    });
  }

  /**
   * Unsubscribe to stations channel.
   * @param {function} cb The listener callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribe.
   */
  unsubscribeStations(cb) {
    window.clearTimeout(this.stationUpdateTimeout);
    this.unsubscribe('station', '', cb);
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
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeExtraGeoms(cb) {
    this.unsubscribe('extra_geoms', '', cb);
  }

  /**
   * Subscribe to trajectory channel.
   *
   * @param {TralisMode} mode Tralis mode.
   * @param {function(trajectory: TralisTrajectory)} onMessage Function called on each message of the channel.
   * @param {boolean} quiet If true, the subscription will not send GET and SUB requests to the websocket.
   */
  subscribeTrajectory(mode, onMessage, quiet = false) {
    this.unsubscribeTrajectory(onMessage);
    this.subscribe(
      `trajectory${getModeSuffix(mode, TralisModes)}`,
      onMessage,
      null,
      quiet,
    );
  }

  /**
   * Unsubscribe to trajectory channels.
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeTrajectory(cb) {
    this.unsubscribe(`trajectory`, '', cb);
  }

  /**
   * Subscribe to deleted_vhicles channel.
   *
   * @param {TralisMode} mode Tralis mode.
   * @param {function(response: { content: Vehicle })} onMessage Function called on each message of the channel.
   * @param {boolean} quiet If true, the subscription will not send GET and SUB requests to the websocket.
   */
  subscribeDeletedVehicles(mode, onMessage, quiet = false) {
    this.unsubscribeDeletedVehicles(onMessage);
    this.subscribe(
      `deleted_vehicles${getModeSuffix(mode, TralisModes)}`,
      onMessage,
      null,
      quiet,
    );
  }

  /**
   * Unsubscribe to deleted_vhicles channels.
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDeletedVehicles(cb) {
    this.unsubscribe('deleted_vehicles', '', cb);
  }

  /**
   * Get a full trajectory of a vehicule .
   *
   * @param {string} id A vehicle id.
   * @param {TralisMode} mode Tralis mode.
   * @param {string} generalizationLevel The generalization level to request. Can be one of 5 (more generalized), 10, 30, 100, undefined (less generalized).
   * @return {Promise<FullTrajectory>} Return a full trajectory.
   */
  getFullTrajectory(id, mode, generalizationLevel) {
    const channel = [`full_trajectory${getModeSuffix(mode, TralisModes)}`];
    if (id) {
      channel.push(id);
    }

    if ((!mode || mode === TralisModes.TOPOGRAPHIC) && generalizationLevel) {
      channel.push(`gen${generalizationLevel}`);
    }

    const params = {
      channel: channel.join('_'),
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
   * @param {string[]} ids List of vehicles ids.
   * @param {TralisMode} mode Tralis mode.
   * @param {string} generalizationLevel The generalization level to request. Can be one of '', 'gen5', 'gen10', 'gen30', 'gen100'.
   * @return {Promise<Array<FullTrajectory>>} Return an array of full trajectories.
   */
  getFullTrajectories(ids, mode, generalizationLevel) {
    const promises = ids.map((id) =>
      this.getFullTrajectory(id, mode, generalizationLevel),
    );
    return Promise.all(promises);
  }

  /**
   * Subscribe to full_trajectory channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
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
   * @param {string} id A vehicle id.
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeFullTrajectory(id, cb) {
    this.unsubscribe('full_trajectory', `_${id}`, cb);
  }

  /**
   * Get the list of stops for this vehicle.
   *
   * @param {string} id A vehicle id.
   * @return {Promise<StopSequence>} Returns a stop sequence object.
   */
  getStopSequence(id) {
    const params = {
      channel: `stopsequence_${id}`,
    };
    return new Promise((resolve, reject) => {
      this.conn.get(
        params,
        (data) => {
          if (data.content && data.content.length) {
            const content = data.content.map((stopSequence) =>
              cleanStopTime(stopSequence),
            );

            // Remove the delay from arrivalTime and departureTime
            resolve(content);
          }
          resolve([]);
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
   * @param {string[]} ids List of vehicles ids.
   * @return {Promise<Array<StopSequence>>} Return an array of stop sequences.
   */
  getStopSequences(ids) {
    const promises = ids.map((id) => this.getStopSequence(id));
    return Promise.all(promises);
  }

  /**
   * Subscribe to stopsequence channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
   * @param {function(stopSequence: StopSequence)} onMessage Function called on each message of the channel.
   */
  subscribeStopSequence(id, onMessage) {
    window.clearTimeout(this.fullTrajectoryUpdateTimeout);
    this.unsubscribeStopSequence(id);

    this.subscribe(
      `stopsequence_${id}`,
      (data) => {
        if (data.content && data.content.length) {
          const content = data.content.map((stopSequence) =>
            cleanStopTime(stopSequence),
          );

          // Remove the delay from arrivalTime and departureTime
          onMessage(content);
        }
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
   * @param {string} id A vehicle id.
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeStopSequence(id, cb) {
    this.unsubscribe(`stopsequence`, `_${id}`, cb);
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
