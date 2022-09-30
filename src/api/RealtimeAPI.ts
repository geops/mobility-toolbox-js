import WebSocketAPI, {
  WebSocketAPIDataCallback,
  WebSocketAPIMessageEventData,
} from '../common/api/WebSocketAPI';
import getModeSuffix from '../common/utils/getRealtimeModeSuffix';
import compareDepartures from '../common/utils/compareDepartures';
import {
  RealtimeMode,
  RealtimeDeparture,
  RealtimeNews,
  RealtimeDepartureExtended,
  RealtimeStation,
  RealtimeExtraGeom,
  RealtimeTrainId,
  RealtimeGeneralizationLevel,
  RealtimeFullTrajectory,
  RealtimeTrajectoryResponse,
  RealtimeStationId,
} from '../types';
import { StopSequence } from './typedefs';

export type RealtimeAPIOptions = {
  url?: string;
  apiKey?: string;
  prefix?: string;
  projection?: string;
  bbox?: (number | string)[];
  buffer?: number[];
  pingIntervalMs?: number;
};

export declare type RealtimeAPIExtraGeomsById = {
  [index: string]: RealtimeExtraGeom;
};

export type RealtimeAPIDeparturesById = {
  [index: string]: RealtimeDeparture;
};

export type RealtimeModesType = {
  RAW: RealtimeMode;
  TOPOGRAPHIC: RealtimeMode;
  SCHEMATIC: RealtimeMode;
};

/**
 * Enum for Realtime modes.
 * @readonly
 * @typedef {string} RealtimeMode
 * @property {string} RAW "raw"
 * @property {string} SCHEMATIC "schematic"
 * @property {string} TOPOGRAPHIC "topographic"
 * @enum {RealtimeMode}
 */
export const RealtimeModes = {
  RAW: 'raw' as RealtimeMode,
  TOPOGRAPHIC: 'topographic' as RealtimeMode,
  SCHEMATIC: 'schematic' as RealtimeMode,
};

/**
 * This class provides convenience methods to access to the [geOps realtime api](https://developer.geops.io/apis/realtime/).
 *
 * @example
 * import { RealtimeAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RealtimeAPI({
 *   url: "yourUrl",
 *   apiKey: "yourApiKey"
 * });
 *
 * @example
 * import { RealtimeAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RealtimeAPI("yourUrl");
 */
class RealtimeAPI {
  url!: string;

  wsApi!: WebSocketAPI;

  projection?: string;

  bbox?: (number | string)[];

  buffer?: number[];

  maxDepartureAge!: number;

  prefix!: string;

  extraGeoms!: RealtimeAPIExtraGeomsById;

  departureUpdateTimeout?: number;

  pingInterval!: number;

  pingIntervalMs!: number;

  reconnectTimeout?: number;

  reconnectTimeoutMs?: number;

  stationUpdateTimeout?: number;

  fullTrajectoryUpdateTimeout?: number;

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
  constructor(options: RealtimeAPIOptions = {}) {
    this.defineProperties(options);

    /** @ignore */
    this.departureUpdateTimeout = undefined;

    /** @ignore */
    this.maxDepartureAge = 30;

    /** @ignore */
    this.prefix = options.prefix || '';

    /** @ignore */
    this.onOpen = this.onOpen.bind(this);
  }

  /* @private */
  defineProperties(options: RealtimeAPIOptions) {
    let opt = options;

    if (typeof options === 'string') {
      opt = { url: options };
    }

    const { apiKey } = opt;
    let { url, projection, bbox, buffer = [100, 100] } = opt;
    const wsApi = new WebSocketAPI();

    if (!url) {
      url = 'wss://api.geops.io/tracker-ws/v1/';
    }

    if (apiKey) {
      url = `${url}?key=${apiKey}`;
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
            if (this.wsApi) {
              this.wsApi.send(`PROJECTION ${projection}`);
            }
          }
        },
      },
      bbox: {
        get: () => bbox,
        set: (newBbox) => {
          if (JSON.stringify(newBbox) !== JSON.stringify(bbox)) {
            bbox = newBbox;
            if (this.wsApi && bbox) {
              this.wsApi.send(`BBOX ${bbox.join(' ')}`);
            }
          }
        },
      },
      buffer: {
        get: () => buffer,
        set: (newBuffer) => {
          if (JSON.stringify(newBuffer) !== JSON.stringify(buffer)) {
            buffer = newBuffer;
            if (this.wsApi) {
              this.wsApi.send(`BUFFER ${buffer.join(' ')}`);
            }
          }
        },
      },
      /**
       * The websocket helper class to connect the websocket.
       *
       * @private
       */
      wsApi: {
        value: wsApi,
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
    this.wsApi.connect(this.url, this.onOpen);

    // Register reconnection on close.
    if (this.wsApi.websocket) {
      this.wsApi.websocket.onclose = () => {
        this.onClose();
      };
    }
  }

  /**
   * Close the websocket connection without reconnection.
   */
  close() {
    this.wsApi.close();
  }

  /**
   * Unsubscribe trajectory and deleted_vehicles channels. To resubscribe you have to set a new BBOX.
   */
  // eslint-disable-next-line class-methods-use-this
  reset() {
    this.wsApi.send('RESET');
  }

  /**
   * Callback when the websocket is opened and ready.
   * It applies the bbox and the projection.
   */
  onOpen() {
    if (this.projection) {
      this.wsApi.send(`PROJECTION ${this.projection}`);
    }

    if (this.bbox) {
      this.wsApi.send(`BBOX ${this.bbox.join(' ')}`);
    }

    if (this.buffer) {
      this.wsApi.send(`BUFFER ${this.buffer.join(' ')}`);
    }

    /**
     * Keep websocket alive
     */
    if (this.pingIntervalMs) {
      window.clearInterval(this.pingInterval);
      /** @ignore */
      this.pingInterval = window.setInterval(() => {
        this.wsApi.send('PING');
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
  subscribe(
    channel: string,
    onSuccess: WebSocketAPIDataCallback<any>,
    onError?: EventListener,
    quiet: boolean = false,
  ) {
    if (!channel || !onSuccess) {
      return;
    }
    this.wsApi.subscribe({ channel }, onSuccess, onError, quiet);
  }

  /**
   * Unsubscribe both modes of a channel.
   *
   * @param {string} channel Name of the websocket channel to unsubscribe.
   * @param {string} suffix Suffix to add to the channel name.
   * @param {function} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @private
   */
  unsubscribe(
    channel: string,
    suffix: string = '',
    onMessage?: WebSocketAPIDataCallback<any>,
  ) {
    this.wsApi.unsubscribe(
      `${channel}${getModeSuffix(
        RealtimeModes.SCHEMATIC,
        RealtimeModes,
      )}${suffix}`,
      onMessage,
    );
    this.wsApi.unsubscribe(
      `${channel}${getModeSuffix(RealtimeModes.TOPOGRAPHIC, RealtimeModes)}${
        suffix || ''
      }`,
      onMessage,
    );
  }

  /**
   * Filter departures and return an array.
   *
   * @param {Object} depObject The object containing departures by id.
   * @param {boolean} [sortByMinArrivalTime=false] If true sort departures by arrival time.
   * @return {Array<Departure>} Return departures array.
   * @private
   */
  filterDepartures(
    depObject: RealtimeAPIDeparturesById,
    sortByMinArrivalTime: boolean = false,
  ): RealtimeDepartureExtended[] {
    const departures = Object.keys(depObject).map((k) => depObject[k]);
    departures.sort((a, b) => compareDepartures(a, b, sortByMinArrivalTime));

    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + this.maxDepartureAge);
    const future = futureDate.getTime();

    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - this.maxDepartureAge);
    const past = pastDate.getTime();

    const departureArray = [];
    const platformsBoarding = [];
    let previousDeparture = null;

    for (let i = departures.length - 1; i >= 0; i -= 1) {
      const departure: RealtimeDepartureExtended = {
        ...departures[i],
      };
      const time = new Date(departure.time).getTime();

      // Only show departures within the next 30 minutes
      if (time > past && time < future) {
        // If 2 trains are boarding at the same platform,
        // remove the older one.
        if (departure.state === 'BOARDING') {
          if (platformsBoarding.indexOf(departure.platform) === -1) {
            platformsBoarding.push(departure.platform);
          } else {
            departure.state = 'HIDDEN';
          }
        }

        // If two trains with the same line number and destinatin
        // and a departure difference < 1 minute, hide the second one.
        if (
          previousDeparture &&
          departure.to[0] === previousDeparture.to[0] &&
          Math.abs(time - previousDeparture.time) < 1000 &&
          departure.line.name === previousDeparture.line.name
        ) {
          departure.state = 'HIDDEN';
        }

        if (/(STOP_CANCELLED|JOURNEY_CANCELLED)/.test(departure.state)) {
          departure.cancelled = true;
        }

        previousDeparture = departure;
        previousDeparture.time = time;
        departureArray.unshift(departure);
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
  subscribeDepartures(
    stationId: number,
    sortByMinArrivalTime: boolean,
    onMessage: (departures: RealtimeDepartureExtended[]) => void,
  ) {
    window.clearTimeout(this.departureUpdateTimeout);
    this.unsubscribeDepartures(stationId);
    const channel = stationId ? `timetable_${stationId}` : null;
    const departureObject: RealtimeAPIDeparturesById = {};

    if (!channel) {
      return;
    }

    const onSuccess: WebSocketAPIDataCallback<RealtimeDeparture> = (
      data: WebSocketAPIMessageEventData<RealtimeDeparture>,
    ) => {
      if (data.source === channel) {
        const content = (data.content as RealtimeDeparture) || {};
        // TODO: These lines seems useless because content.timestamp never exists
        // we should check if actually the case
        const tDiff = new Date(content.timestamp).getTime() - Date.now();
        departureObject[content.call_id] = { ...content, timediff: tDiff };

        window.clearTimeout(this.departureUpdateTimeout);
        this.departureUpdateTimeout = window.setTimeout(() => {
          const departures = this.filterDepartures(
            departureObject,
            sortByMinArrivalTime || false,
          );
          onMessage(departures);
        }, 100);
      }
    };

    this.subscribe(channel, onSuccess, () => {
      onMessage([]);
    });
  }

  /**
   * Unsubscribe from current departures channel.
   * @param {RealtimeStationId} id Station's id
   * @param {function({data: { content: RealtimeDeparture[] }})} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDepartures(
    id: RealtimeStationId,
    onMessage?: WebSocketAPIDataCallback<RealtimeDeparture>,
  ) {
    this.unsubscribe(`timetable_${id}`, '', onMessage);
  }

  /**
   * Subscribe to the disruptions channel for tenant.
   *
   * @param {function({data: { content: RealtimeNews[] }})} onMessage Function called on each message of the channel.
   */
  subscribeDisruptions(onMessage: WebSocketAPIDataCallback<RealtimeNews>) {
    this.subscribe(`${this.prefix}newsticker`, onMessage);
  }

  /**
   * Unsubscribe disruptions.
   *
   * @param {function({data: { content: RealtimeNews[] }})} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDisruptions(onMessage?: WebSocketAPIDataCallback<RealtimeNews>) {
    this.unsubscribe(`${this.prefix}newsticker`, '', onMessage);
  }

  /**
   * Return a station with a given uic number and a mode.
   *
   * @param {number} uic UIC of the station.
   * @param {RealtimeMode} mode Realtime mode.
   * @return {Promise<Station>} A station.
   */
  getStation(uic: number, mode: RealtimeMode) {
    const params = {
      channel: `station${getModeSuffix(mode, RealtimeModes)}`,
      args: uic,
    };

    return new Promise((resolve, reject) => {
      this.wsApi.get(params, (data) => {
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
   * @param {RealtimeMode} mode Realtime mode.
   * @return {Promise<Array<Station>>} An array of stations.
   */
  getStations(mode: RealtimeMode) {
    const stations = [] as RealtimeStation[];
    const params = {
      channel: `station${getModeSuffix(mode, RealtimeModes)}`,
    };
    window.clearTimeout(this.stationUpdateTimeout);
    return new Promise((resolve, reject) => {
      this.wsApi.get(params, (data) => {
        if (data.content) {
          stations.push(data.content as RealtimeStation);
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
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function({data: { content: RealtimeStation }})} onMessage Function called on each message of the channel.
   */
  subscribeStations(
    mode: RealtimeMode,
    onMessage: WebSocketAPIDataCallback<RealtimeStation>,
  ) {
    this.unsubscribeStations();
    this.subscribe(`station${getModeSuffix(mode, RealtimeModes)}`, onMessage);
  }

  /**
   * Unsubscribe to stations channel.
   * @param {function({data: { content: RealtimeStation }})} onMessage The listener callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribe.
   */
  unsubscribeStations(onMessage?: WebSocketAPIDataCallback<RealtimeStation>) {
    this.unsubscribe('station', '', onMessage);
  }

  /**
   * Subscribe to extra_geoms channel.
   *
   * @param {function({data: { content: RealtimeExtraGeom }})} onMessage Function called on each message of the channel.
   */
  subscribeExtraGeoms(onMessage: WebSocketAPIDataCallback<RealtimeExtraGeom>) {
    this.subscribe('extra_geoms', onMessage);
  }

  /**
   * Unsubscribe to extra_geoms channel.
   * @param {function({data: { content: RealtimeExtraGeom }})} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeExtraGeoms(
    onMessage: WebSocketAPIDataCallback<RealtimeExtraGeom>,
  ) {
    this.unsubscribe('extra_geoms', '', onMessage);
  }

  /**
   * Subscribe to trajectory channel.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function({data: { content: RealtimeTrajectoryResponse[] }})} onMessage Function called on each message of the channel.
   * @param {boolean} quiet If true, the subscription will not send GET and SUB requests to the websocket.
   */
  subscribeTrajectory(
    mode: RealtimeMode,
    onMessage: WebSocketAPIDataCallback<RealtimeTrajectoryResponse[]>,
    quiet = false,
  ) {
    this.unsubscribeTrajectory(onMessage);
    this.subscribe(
      `trajectory${getModeSuffix(mode, RealtimeModes)}`,
      onMessage,
      undefined,
      quiet,
    );
  }

  /**
   * Unsubscribe to trajectory channels.
   * @param {v} onMessage Function called on each message of the channel.
   * @param {function} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeTrajectory(
    onMessage: WebSocketAPIDataCallback<RealtimeTrajectoryResponse[]>,
  ) {
    this.unsubscribe(`trajectory`, '', onMessage);
  }

  /**
   * Subscribe to deleted_vhicles channel.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function({data: { content: RealtimeTrainId }})} onMessage Function called on each message of the channel.
   * @param {boolean} quiet If true, the subscription will not send GET and SUB requests to the websocket.
   */
  subscribeDeletedVehicles(
    mode: RealtimeMode,
    onMessage: WebSocketAPIDataCallback<RealtimeTrainId>,
    quiet = false,
  ) {
    this.unsubscribeDeletedVehicles(onMessage);
    this.subscribe(
      `deleted_vehicles${getModeSuffix(mode, RealtimeModes)}`,
      onMessage,
      undefined,
      quiet,
    );
  }

  /**
   * Unsubscribe to deleted_vhicles channels.
   * @param {function({data: { content: RealtimeTrainId }})} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDeletedVehicles(
    onMessage: WebSocketAPIDataCallback<RealtimeTrainId>,
  ) {
    this.unsubscribe('deleted_vehicles', '', onMessage);
  }

  /**
   * Get a full trajectory of a vehicule .
   *
   * @param {string} id A vehicle id.
   * @param {RealtimeMode} mode Realtime mode.
   * @param {string} generalizationLevel The generalization level to request. Can be one of 5 (more generalized), 10, 30, 100, undefined (less generalized).
   * @return {Promise<FullTrajectory>} Return a full trajectory.
   */
  getFullTrajectory(
    id: RealtimeTrainId,
    mode: RealtimeMode,
    generalizationLevel: RealtimeGeneralizationLevel | undefined,
  ): Promise<RealtimeFullTrajectory> {
    const channel = [`full_trajectory${getModeSuffix(mode, RealtimeModes)}`];
    if (id) {
      channel.push(id);
    }

    if ((!mode || mode === RealtimeModes.TOPOGRAPHIC) && generalizationLevel) {
      channel.push(`gen${generalizationLevel}`);
    }

    const params = {
      channel: channel.join('_'),
    };

    return new Promise((resolve) => {
      this.wsApi.get(params, (data) => {
        if (data.content) {
          resolve(data.content as RealtimeFullTrajectory);
        }
      });
    });
  }

  /**
   * Get full trajectories of a vehicules .
   *
   * @param {string[]} ids List of vehicles ids.
   * @param {RealtimeMode} mode Realtime mode.
   * @param {string} generalizationLevel The generalization level to request. Can be one of '', 'gen5', 'gen10', 'gen30', 'gen100'.
   * @return {Promise<Array<FullTrajectory>>} Return an array of full trajectories.
   */
  getFullTrajectories(
    ids: RealtimeTrainId[],
    mode: RealtimeMode,
    generalizationLevel: RealtimeGeneralizationLevel,
  ) {
    const promises = ids.map((id) =>
      this.getFullTrajectory(id, mode, generalizationLevel),
    );
    return Promise.all(promises);
  }

  /**
   * Subscribe to full_trajectory channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function({ data: { content: RealtimeFullTrajectory } }) onMessage Function called on each message of the channel.
   */
  subscribeFullTrajectory(
    id: RealtimeTrainId,
    mode: RealtimeMode,
    onMessage: WebSocketAPIDataCallback<RealtimeFullTrajectory>,
  ) {
    // window.clearTimeout(this.fullTrajectoryUpdateTimeout);
    this.unsubscribeFullTrajectory(id);
    this.subscribe(
      `full_trajectory${getModeSuffix(mode, RealtimeModes)}_${id}`,
      onMessage,
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
   * @param {function({ data: { content: RealtimeFullTrajectory } }} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeFullTrajectory(
    id: RealtimeTrainId,
    onMessage?: WebSocketAPIDataCallback<RealtimeFullTrajectory>,
  ) {
    this.unsubscribe('full_trajectory', `_${id}`, onMessage);
  }

  /**
   * Get the list of stops for this vehicle.
   *
   * @param {string} id A vehicle id.
   * @return {Promise<StopSequence>} Returns a stop sequence object.
   */
  getStopSequence(id: RealtimeTrainId) {
    return new Promise((resolve, reject) => {
      this.wsApi.get(
        {
          channel: `stopsequence_${id}`,
        },
        (data) => {
          resolve(data);
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
  getStopSequences(ids: RealtimeTrainId[]) {
    const promises = ids.map((id) => this.getStopSequence(id));
    return Promise.all(promises);
  }

  /**
   * Subscribe to stopsequence channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
   * @param {function({ data: { content: StopSequence[] } }) onMessage Function called on each message of the channel.
   */
  subscribeStopSequence(
    id: RealtimeTrainId,
    onMessage: WebSocketAPIDataCallback<StopSequence[]>,
  ) {
    window.clearTimeout(this.fullTrajectoryUpdateTimeout);
    this.unsubscribeStopSequence(id);

    this.subscribe(`stopsequence_${id}`, onMessage, (err) => {
      // eslint-disable-next-line no-console
      console.log('subscribe stopsequence error', err);
    });
  }

  /**
   * Unsubscribe from stopsequence channel
   *
   * @param {string} id A vehicle id.
   * @param {function({ data: { content: StopSequence[] } }} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeStopSequence(
    id: RealtimeTrainId,
    onMessage?: WebSocketAPIDataCallback<StopSequence[]>,
  ) {
    this.unsubscribe(`stopsequence`, `_${id}`, onMessage);
  }

  /**
   * Subscribe to healthcheck channel.
   * @param {function({ data: { content: string } }} onMessage Callback when the subscribe to healthcheck channel succeeds.
   */
  subscribeHealthCheck(onMessage: WebSocketAPIDataCallback<string>) {
    this.unsubscribeHealthCheck(onMessage);
    this.subscribe('healthcheck', onMessage);
  }

  /**
   * Unsubscribe to healthcheck channel.
   * @param {function({ data: { content: string } }} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeHealthCheck(onMessage?: WebSocketAPIDataCallback<string>) {
    this.unsubscribe('healthcheck', '', onMessage);
  }
}
export default RealtimeAPI;
