import WebSocketAPI, {
  WebSocketAPIMessageCallback,
  WebSocketAPIMessageEventData,
} from '../common/api/WebSocketAPI';
import debounceWebsocketMessages from '../common/utils/debounceWebsocketMessages';
import getModeSuffix from '../common/utils/getRealtimeModeSuffix';
import type {
  RealtimeMode,
  RealtimeDeparture,
  RealtimeNews,
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

  prefix!: string;

  pingInterval!: number;

  pingIntervalMs!: number;

  reconnectTimeout?: number;

  reconnectTimeoutMs?: number;

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
    onSuccess: WebSocketAPIMessageCallback<any>,
    onError: EventListener = () => {},
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
    onMessage?: WebSocketAPIMessageCallback<any>,
  ) {
    const suffixSchenatic = getModeSuffix(
      RealtimeModes.SCHEMATIC,
      RealtimeModes,
    );
    const suffixTopographic = getModeSuffix(
      RealtimeModes.TOPOGRAPHIC,
      RealtimeModes,
    );
    this.wsApi.unsubscribe(
      `${channel}${suffixSchenatic}${suffix || ''}`,
      onMessage,
    );
    this.wsApi.unsubscribe(
      `${channel}${suffixTopographic}${suffix || ''}`,
      onMessage,
    );
  }

  /**
   * Subscribe to departures channel of a given station.
   *
   * @param {number} stationId UIC of the station.
   * @param {Boolean} sortByMinArrivalTime Sort by minimum arrival time
   * @param {function(departures:Departure[])} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeDepartures(
    stationId: number,
    onMessage: WebSocketAPIMessageCallback<RealtimeDeparture>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.subscribe(`timetable_${stationId}`, onMessage, onError, quiet);
  }

  /**
   * Unsubscribe from current departures channel.
   * @param {RealtimeStationId} id Station's id
   * @param {function(data: { content: RealtimeDeparture[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDepartures(
    id: RealtimeStationId,
    onMessage?: WebSocketAPIMessageCallback<RealtimeDeparture>,
  ) {
    this.unsubscribe(`timetable_${id}`, '', onMessage);
  }

  /**
   * Subscribe to the disruptions channel for tenant.
   *
   * @param {function(data: { content: RealtimeNews[] })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeDisruptions(
    onMessage: WebSocketAPIMessageCallback<RealtimeNews>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.subscribe(`${this.prefix}newsticker`, onMessage, onError, quiet);
  }

  /**
   * Unsubscribe disruptions.
   *
   * @param {function(data: { content: RealtimeNews[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDisruptions(
    onMessage?: WebSocketAPIMessageCallback<RealtimeNews>,
  ) {
    this.unsubscribe(`${this.prefix}newsticker`, '', onMessage);
  }

  /**
   * Return a station with a given uic number and a mode.
   *
   * @param {number} uic UIC of the station.
   * @param {RealtimeMode} mode Realtime mode.
   * @return {Promise<{data: { content: RealtimeStation }}>} A station.
   */
  getStation(
    uic: RealtimeStationId,
    mode: RealtimeMode,
  ): Promise<WebSocketAPIMessageEventData<RealtimeStation>> {
    const params = {
      channel: `station${getModeSuffix(mode, RealtimeModes)}`,
      args: uic,
    };

    return new Promise((resolve, reject) => {
      this.wsApi.get(params, resolve, reject);
    });
  }

  /**
   * Get the list of ststions available for a specifc mode. The promise is resolved every 100ms
   * @param {RealtimeMode} mode Realtime mode.
   * @param {number} timeout = 100 Duration in ms between each promise resolve calls.
   * @return {Promise<RealtimeStation[]>} An array of stations.
   */
  getStations(mode: RealtimeMode, timeout = 100): Promise<RealtimeStation[]> {
    return new Promise((resolve) => {
      this.wsApi.get(
        {
          channel: `station${getModeSuffix(mode, RealtimeModes)}`,
        },
        debounceWebsocketMessages(resolve, undefined, timeout),
      );
    });
  }

  /**
   * Subscribe to stations channel.
   * One message pro station.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data: { content: RealtimeStation })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeStations(
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<RealtimeStation>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.subscribe(
      `station${getModeSuffix(mode, RealtimeModes)}`,
      onMessage,
      onError,
      quiet,
    );
  }

  /**
   * Unsubscribe to stations channel.
   * @param {function(data: { content: RealtimeStation })} onMessage The listener callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribe.
   */
  unsubscribeStations(
    onMessage?: WebSocketAPIMessageCallback<RealtimeStation>,
  ) {
    this.unsubscribe('station', '', onMessage);
  }

  /**
   * Subscribe to extra_geoms channel.
   *
   * @param {function(data: { content: RealtimeExtraGeom })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeExtraGeoms(
    onMessage: WebSocketAPIMessageCallback<RealtimeExtraGeom>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.subscribe('extra_geoms', onMessage, onError, quiet);
  }

  /**
   * Unsubscribe to extra_geoms channel.
   * @param {function(data: { content: RealtimeExtraGeom })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeExtraGeoms(
    onMessage: WebSocketAPIMessageCallback<RealtimeExtraGeom>,
  ) {
    this.unsubscribe('extra_geoms', '', onMessage);
  }

  /**
   * Subscribe to trajectory channel.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data: { content: RealtimeTrajectoryResponse[] })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeTrajectory(
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<
      RealtimeTrajectoryResponse[] | RealtimeTrajectoryResponse
    >,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.unsubscribeTrajectory(onMessage);
    this.subscribe(
      `trajectory${getModeSuffix(mode, RealtimeModes)}`,
      onMessage,
      onError,
      quiet,
    );
  }

  /**
   * Unsubscribe to trajectory channels.
   * @param {function(data: { content: RealtimeTrajectoryResponse[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeTrajectory(
    onMessage: WebSocketAPIMessageCallback<RealtimeTrajectoryResponse[]>,
  ) {
    this.unsubscribe(`trajectory`, '', onMessage);
  }

  /**
   * Subscribe to deleted_vhicles channel.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data: { content: RealtimeTrainId })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeDeletedVehicles(
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<RealtimeTrainId>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.unsubscribeDeletedVehicles(onMessage);
    this.subscribe(
      `deleted_vehicles${getModeSuffix(mode, RealtimeModes)}`,
      onMessage,
      onError,
      quiet,
    );
  }

  /**
   * Unsubscribe to deleted_vhicles channels.
   * @param {function(data: { content: RealtimeTrainId })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeDeletedVehicles(
    onMessage: WebSocketAPIMessageCallback<RealtimeTrainId>,
  ) {
    this.unsubscribe('deleted_vehicles', '', onMessage);
  }

  /**
   * Get a full trajectory of a vehicule .
   *
   * @param {string} id A vehicle id.
   * @param {RealtimeMode} mode Realtime mode.
   * @param {string} generalizationLevel The generalization level to request. Can be one of 5 (more generalized), 10, 30, 100, undefined (less generalized).
   * @return {Promise<{ data: { content: FullTrajectory } }>} Return a full trajectory.
   */
  getFullTrajectory(
    id: RealtimeTrainId,
    mode: RealtimeMode,
    generalizationLevel: RealtimeGeneralizationLevel | undefined,
  ): Promise<WebSocketAPIMessageEventData<RealtimeFullTrajectory>> {
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

    return new Promise((resolve, reject) => {
      this.wsApi.get(params, resolve, reject);
    });
  }

  /**
   * Subscribe to full_trajectory channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data: { content: RealtimeFullTrajectory })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeFullTrajectory(
    id: RealtimeTrainId,
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<RealtimeFullTrajectory>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.subscribe(
      `full_trajectory${getModeSuffix(mode, RealtimeModes)}_${id}`,
      onMessage,
      onError,
      quiet,
    );
  }

  /**
   * Unsubscribe from full_trajectory channel
   *
   * @param {string} id A vehicle id.
   * @param {function(data: { content: RealtimeFullTrajectory })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeFullTrajectory(
    id: RealtimeTrainId,
    onMessage?: WebSocketAPIMessageCallback<RealtimeFullTrajectory>,
  ) {
    this.unsubscribe('full_trajectory', `_${id}`, onMessage);
  }

  /**
   * Get the list of stops for this vehicle.
   *
   * @param {string} id A vehicle id.
   * @return {Promise<{ data: { content: StopSequence[] } }>} Returns a stop sequence object.
   */
  getStopSequence(
    id: RealtimeTrainId,
  ): Promise<WebSocketAPIMessageEventData<StopSequence[]>> {
    return new Promise((resolve, reject) => {
      this.wsApi.get(
        {
          channel: `stopsequence_${id}`,
        },
        resolve,
        reject,
      );
    });
  }

  /**
   * Subscribe to stopsequence channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
   * @param {function(data: { content: StopSequence[] })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeStopSequence(
    id: RealtimeTrainId,
    onMessage: WebSocketAPIMessageCallback<StopSequence[]>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.subscribe(`stopsequence_${id}`, onMessage, onError, quiet);
  }

  /**
   * Unsubscribe from stopsequence channel
   *
   * @param {string} id A vehicle id.
   * @param {function(data: { content: StopSequence[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeStopSequence(
    id: RealtimeTrainId,
    onMessage?: WebSocketAPIMessageCallback<StopSequence[]>,
  ) {
    this.unsubscribe(`stopsequence`, `_${id}`, onMessage);
  }

  /**
   * Subscribe to healthcheck channel.
   * @param {function(data: { content: string })} onMessage Callback when the subscribe to healthcheck channel succeeds.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   */
  subscribeHealthCheck(
    onMessage: WebSocketAPIMessageCallback<string>,
    onError: EventListener = () => {},
    quiet: boolean = false,
  ) {
    this.subscribe('healthcheck', onMessage, onError, quiet);
  }

  /**
   * Unsubscribe to healthcheck channel.
   * @param {function(data: { content: string })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeHealthCheck(onMessage?: WebSocketAPIMessageCallback<string>) {
    this.unsubscribe('healthcheck', '', onMessage);
  }
}
export default RealtimeAPI;
