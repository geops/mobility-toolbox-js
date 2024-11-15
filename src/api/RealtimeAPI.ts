/* eslint-disable no-underscore-dangle */
import debounceWebsocketMessages from '../common/utils/debounceWebsocketMessages';
import getModeSuffix from '../common/utils/getRealtimeModeSuffix';

/* eslint-disable class-methods-use-this */
import WebSocketAPI, {
  WebSocketAPIMessageCallback,
  WebSocketAPIMessageEventData,
  WebSocketAPIParameters,
} from './WebSocketAPI';

import type {
  RealtimeBbox,
  RealtimeDeparture,
  RealtimeExtraGeom,
  RealtimeFullTrajectory,
  RealtimeGeneralizationLevel,
  RealtimeMode,
  RealtimeNews,
  RealtimeStation,
  RealtimeStationId,
  RealtimeStopSequence,
  RealtimeTenant,
  RealtimeTrainId,
  RealtimeTrajectory,
  RealtimeVersion,
} from '../types';

/**
 * @typedef RealtimeAPIOptions
 */
export interface RealtimeAPIOptions {
  apiKey?: string;
  bbox?: RealtimeBbox;
  buffer?: number[];
  pingIntervalMs?: number;
  reconnectTimeoutMs?: number;
  url?: string;
  version?: RealtimeVersion;
}

export type RealtimeAPIExtraGeomsById = Record<string, RealtimeExtraGeom>;

export type RealtimeAPIDeparturesById = Record<string, RealtimeDeparture>;

export interface RealtimeModesType {
  RAW: RealtimeMode;
  SCHEMATIC: RealtimeMode;
  TOPOGRAPHIC: RealtimeMode;
}

/**
 * Enum for Realtime modes.
 * @readonly
 * @typedef {string} RealtimeMode
 * @property {string} RAW "raw"
 * @property {string} SCHEMATIC "schematic"
 * @property {string} TOPOGRAPHIC "topographic"
 * @enum {RealtimeMode}
 * @public
 */
export const RealtimeModes = {
  RAW: 'raw' as RealtimeMode,
  SCHEMATIC: 'schematic' as RealtimeMode,
  TOPOGRAPHIC: 'topographic' as RealtimeMode,
};

/**
 * This class provides convenience methods to use to the [geOps Realtime API](https://developer.geops.io/apis/realtime/).
 *
 * @example
 * import { RealtimeAPI } from 'mobility-toolbox-js/api';
 *
 * const api = new RealtimeAPI({
 *   apiKey: "yourApiKey",
 *   bbox: [782001, 5888803, 923410, 5923660, 11, "mots=rail"],
 *   // url: "wss://api.geops.io/tracker-ws/v1/",
 * });
 *
 * // Open the websocket connection
 * api.open();
 *
 * // Subscribe to channel
 * api.subscribeTrajectory('topographic', (data) => {
 *    console.log('Log trajectories:', JSON.stringify(data.content));
 * });
 *
 * // Close the websocket connection
 * api.close();
 *
 * @public
 */
class RealtimeAPI {
  private pingInterval!: number;

  private pingIntervalMs!: number;

  private reconnectTimeout?: number;

  private reconnectTimeoutMs?: number;

  _bbox?: RealtimeBbox;

  _buffer?: number[];

  _url!: string;

  version: RealtimeVersion = '2';

  wsApi!: WebSocketAPI;

  /**
   * Constructor
   *
   * @param {Object} options Options.
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {string[]} options.bbox The bounding box to receive data from.
   * @param {string} [options.url='wss://api.geops.io/tracker-ws/v1/'] Url of the [geOps Realtime API](https://developer.geops.io/apis/realtime/).
   * @public
   */
  constructor(options: RealtimeAPIOptions = {}) {
    let opt = options;

    if (typeof options === 'string') {
      opt = { url: options };
    }

    const { apiKey } = opt;
    const { url } = opt;
    const wsApi = new WebSocketAPI();
    let suffix = '';

    if (apiKey && !url?.includes('key=')) {
      suffix = `?key=${apiKey}`;
    }

    this._url = (url || 'wss://api.geops.io/tracker-ws/v1/') + suffix;

    this._buffer = opt.buffer || [100, 100];

    this._bbox = opt.bbox;

    this.version = opt.version || '2';

    /**
     * Interval between PING request in ms.
     * If equal to 0,  no PING request are sent.
     * @type {number}
     */
    this.pingIntervalMs = opt.pingIntervalMs || 10000;

    /**
     * Timeout in ms after an automatic reconnection when the websoscket has been closed by the server.
     * @type {number}
     */
    this.reconnectTimeoutMs = opt.reconnectTimeoutMs || 100;

    /**
     * The websocket helper class to connect the websocket.
     */
    this.wsApi = wsApi;
  }

  /**
   * Close the websocket connection without reconnection.
   *
   * @public
   */
  close() {
    this.wsApi.close();
  }

  /**
   * Send GET to a channel.
   *
   * @param {string | WebSocketAPIParameters} channelOrParams Name of the websocket channel to send GET or an object representing parameters to send
   * @return {Promise<WebSocketAPIMessageEventData<?>>} A websocket response.
   * @public
   */
  get(
    channelOrParams: string | WebSocketAPIParameters,
  ): Promise<WebSocketAPIMessageEventData<any>> {
    let params = channelOrParams as WebSocketAPIParameters;

    if (typeof channelOrParams === 'string') {
      params = { channel: channelOrParams };
    }

    return new Promise((resolve, reject) => {
      this.wsApi.get(params, resolve, reject);
    });
  }

  /**
   * Get a full trajectory of a vehicule .
   *
   * @param {string} id A vehicle id.
   * @param {RealtimeMode} mode Realtime mode.
   * @param {string} generalizationLevel The generalization level to request. Can be one of 5 (more generalized), 10, 30, 100, undefined (less generalized).
   * @return {Promise<{data: { content: RealtimeFullTrajectory }}>} Return a full trajectory.
   * @public
   */
  getFullTrajectory(
    id: RealtimeTrainId,
    mode: RealtimeMode,
    generalizationLevel: RealtimeGeneralizationLevel | undefined,
  ): Promise<WebSocketAPIMessageEventData<RealtimeFullTrajectory>> {
    let suffix = '';
    if (this.version === '1') {
      suffix = getModeSuffix(mode, RealtimeModes);
    }

    const channel = [`full_trajectory${suffix}`];
    if (id) {
      channel.push(id);
    }

    if ((!mode || mode === RealtimeModes.TOPOGRAPHIC) && generalizationLevel) {
      channel.push(`gen${generalizationLevel}`);
    }

    return this.get(channel.join('_'));
  }

  /**
   * Return a station with a given uic number and a mode.
   *
   * @param {number} uic UIC of the station.
   * @param {RealtimeMode} mode Realtime mode.
   * @return {Promise<{data: { content: RealtimeStation }}>} A station.
   * @public
   */
  getStation(
    uic: RealtimeStationId,
    mode: RealtimeMode,
  ): Promise<WebSocketAPIMessageEventData<RealtimeStation>> {
    const params = {
      args: uic,
      channel: `station${getModeSuffix(mode, RealtimeModes)}`,
    };

    return this.get(params);
  }

  /**
   * Get the list of ststions available for a specifc mode. The promise is resolved every 100ms
   * @param {RealtimeMode} mode Realtime mode.
   * @param {number} timeout = 100 Duration in ms between each promise resolve calls.
   * @return {Promise<RealtimeStation[]>} An array of stations.
   * @public
   */
  getStations(mode: RealtimeMode, timeout = 100): Promise<RealtimeStation[]> {
    return new Promise((resolve) => {
      this.get(`station${getModeSuffix(mode, RealtimeModes)}`).then(
        debounceWebsocketMessages(resolve, undefined, timeout),
      );
    });
  }

  /**
   * Get the list of stops for this vehicle.
   *
   * @param {string} id A vehicle id.
   * @return {Promise<{data: { content: RealtimeStopSequence[] }}>} Returns a stop sequence object.
   * @public
   */
  getStopSequence(
    id: RealtimeTrainId,
  ): Promise<WebSocketAPIMessageEventData<RealtimeStopSequence[]>> {
    return this.get(`stopsequence_${id}`);
  }

  /**
   * Return a partial trajectory with a given id and a mode.
   *
   * @param {number} id The identifier of a trajectory.
   * @param {RealtimeMode} mode Realtime mode.
   * @return {Promise<{data: { content: RealtimeTrajectory }}>} A trajectory.
   * @public
   */
  getTrajectory(
    id: RealtimeTrainId,
    mode: RealtimeMode,
  ): Promise<WebSocketAPIMessageEventData<RealtimeTrajectory>> {
    return this.get(
      `partial_trajectory${getModeSuffix(mode, RealtimeModes)}_${id}`,
    );
  }

  /**
   * Callback when the websocket is closed by the server.
   * It auto reconnects after a timeout.
   * @private
   */
  onClose() {
    window.clearTimeout(this.pingInterval);
    window.clearTimeout(this.reconnectTimeout);

    if (this.reconnectTimeoutMs) {
      this.reconnectTimeout = window.setTimeout(
        () => this.open(),
        this.reconnectTimeoutMs,
      );
    }
  }

  /**
   * Callback when the websocket is opened and ready.
   * It applies the bbox and the projection.
   * @private
   */
  onOpen() {
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

      this.pingInterval = window.setInterval(() => {
        this.wsApi.send('PING');
      }, this.pingIntervalMs);
    }
  }

  /**
   * Open the websocket connection.
   *
   * @public
   */
  open() {
    this.wsApi.connect(this.url, this.onOpen.bind(this));

    // Register reconnection on close.
    if (this.wsApi.websocket) {
      this.wsApi.websocket.onclose = () => {
        this.onClose();
      };
    }
  }

  /**
   * Unsubscribe trajectory and deleted_vehicles channels. To resubscribe you have to set a new BBOX.
   */
  reset() {
    this.wsApi.send('RESET');
  }

  /**
   * Subscribe to a channel.
   *
   * @param {string} channel Name of the websocket channel to subscribe.
   * @param {function} onSuccess Callback when the subscription succeeds.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribe(
    channel: string,
    onSuccess: WebSocketAPIMessageCallback<any>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    if (!channel || !onSuccess) {
      return;
    }
    this.wsApi.subscribe({ channel }, onSuccess, onError, quiet);
  }

  /**
   * Subscribe to deleted_vhicles channel.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data: { content: RealtimeTrainId })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribeDeletedVehicles(
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<RealtimeTrainId>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.unsubscribeDeletedVehicles(onMessage);

    let suffix = '';
    if (this.version === '1') {
      suffix = getModeSuffix(mode, RealtimeModes);
    }

    this.subscribe(`deleted_vehicles${suffix}`, onMessage, onError, quiet);
  }

  /**
   * Subscribe to departures channel of a given station.
   *
   * @param {number} stationId UIC of the station.
   * @param {function(departures: RealtimeDeparture[])} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @deprecated Use subscribeTimetable instead.
   */
  subscribeDepartures(
    stationId: number,
    onMessage: WebSocketAPIMessageCallback<RealtimeDeparture>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.subscribeTimetable(stationId, onMessage, onError, quiet);
  }

  /**
   * Subscribe to the disruptions channel for tenant.
   *
   * @param {RealtimeTenant} tenant Tenant's id
   * @param {function(data: { content: RealtimeNews[] })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @deprecated Use subscribeNewsticker instead.
   */
  subscribeDisruptions(
    tenant: RealtimeTenant,
    onMessage: WebSocketAPIMessageCallback<RealtimeNews>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.subscribeNewsticker(tenant, onMessage, onError, quiet);
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
    quiet = false,
  ) {
    this.subscribe('extra_geoms', onMessage, onError, quiet);
  }

  /**
   * Subscribe to full_trajectory channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data:{content: RealtimeFullTrajectory})} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribeFullTrajectory(
    id: RealtimeTrainId,
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<RealtimeFullTrajectory>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    let suffix = '';
    if (this.version === '1') {
      suffix = getModeSuffix(mode, RealtimeModes);
    }

    this.subscribe(`full_trajectory${suffix}_${id}`, onMessage, onError, quiet);
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
    quiet = false,
  ) {
    this.subscribe('healthcheck', onMessage, onError, quiet);
  }

  /**
   * Subscribe to the newsticker channel for tenant.
   *
   * @param {RealtimeTenant} tenant Tenant's id
   * @param {function(data: { content: RealtimeNews[] })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribeNewsticker(
    tenant: RealtimeTenant,
    onMessage: WebSocketAPIMessageCallback<RealtimeNews>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.subscribe(`${tenant}_newsticker`, onMessage, onError, quiet);
  }

  /**
   * Subscribe to stations channel.
   * One message pro station.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data: { content: RealtimeStation })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribeStations(
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<RealtimeStation>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.subscribe(
      `station${getModeSuffix(mode, RealtimeModes)}`,
      onMessage,
      onError,
      quiet,
    );
  }

  /**
   * Subscribe to stopsequence channel of a given vehicle.
   *
   * @param {string} id A vehicle id.
   * @param {function(data: { content: RealtimeStopSequence[] })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribeStopSequence(
    id: RealtimeTrainId,
    onMessage: WebSocketAPIMessageCallback<RealtimeStopSequence[]>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.subscribe(`stopsequence_${id}`, onMessage, onError, quiet);
  }

  /**
   * Subscribe to timetable channel of a given station.
   *
   * @param {number} stationId UIC of the station.
   * @param {function(departures: RealtimeDeparture[])} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribeTimetable(
    stationId: number,
    onMessage: WebSocketAPIMessageCallback<RealtimeDeparture>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.subscribe(`timetable_${stationId}`, onMessage, onError, quiet);
  }

  /**
   * Subscribe to trajectory channel.
   *
   * @param {RealtimeMode} mode Realtime mode.
   * @param {function(data: { content: RealtimeTrajectory })} onMessage Function called on each message of the channel.
   * @param {function} onError Callback when the subscription fails.
   * @param {boolean} [quiet=false] If true avoid to store the subscription in the subscriptions list.
   * @public
   */
  subscribeTrajectory(
    mode: RealtimeMode,
    onMessage: WebSocketAPIMessageCallback<RealtimeTrajectory>,
    onError: EventListener = () => {},
    quiet = false,
  ) {
    this.unsubscribeTrajectory(onMessage);

    let suffix = '';
    if (this.version === '1') {
      suffix = getModeSuffix(mode, RealtimeModes);
    }

    this.subscribe(`trajectory${suffix}`, onMessage, onError, quiet);
  }

  /**
   * Unsubscribe both modes of a channel.
   *
   * @param {string} channel Name of the websocket channel to unsubscribe.
   * @param {string} suffix Suffix to add to the channel name.
   * @param {function} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @public
   */
  unsubscribe(
    channel: string,
    suffix = '',
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
   * Unsubscribe to deleted_vhicles channels.
   * @param {function(data: { content: RealtimeTrainId })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @public
   */
  unsubscribeDeletedVehicles(
    onMessage: WebSocketAPIMessageCallback<RealtimeTrainId>,
  ) {
    this.unsubscribe('deleted_vehicles', '', onMessage);
  }

  /**
   * Unsubscribe from current departures channel.
   * @param {number} stationId UIC of the station.
   * @param {function(data: { content: RealtimeDeparture[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @deprecated Use RealtimeAPI.unsubscribeTimetabe instead.
   */
  unsubscribeDepartures(
    stationId: RealtimeStationId,
    onMessage?: WebSocketAPIMessageCallback<RealtimeDeparture>,
  ) {
    this.unsubscribeTimetable(stationId, onMessage);
  }

  /**
   * Unsubscribe disruptions.
   * @param {RealtimeTenant} tenant Tenant's id
   * @param {Function(data: { content: RealtimeNews[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @deprecated Use unsubscribeNewsticker instead.
   */
  unsubscribeDisruptions(
    tenant: RealtimeTenant,
    onMessage?: WebSocketAPIMessageCallback<RealtimeNews>,
  ) {
    this.unsubscribeNewsticker(tenant, onMessage);
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
   * Unsubscribe from full_trajectory channel
   *
   * @param {string} id A vehicle id.
   * @param {onFullTrajectoryMessageCallback} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @public
   */
  unsubscribeFullTrajectory(
    id: RealtimeTrainId,
    onMessage?: WebSocketAPIMessageCallback<RealtimeFullTrajectory>,
  ) {
    this.unsubscribe('full_trajectory', `_${id}`, onMessage);
  }

  /**
   * Unsubscribe to healthcheck channel.
   * @param {function(data: { content: string })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   */
  unsubscribeHealthCheck(onMessage?: WebSocketAPIMessageCallback<string>) {
    this.unsubscribe('healthcheck', '', onMessage);
  }

  /**
   * Unsubscribe disruptions.
   * @param {RealtimeTenant} tenant Tenant's id
   * @param {Function(data: { content: RealtimeNews[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @public
   */
  unsubscribeNewsticker(
    tenant: RealtimeTenant,
    onMessage?: WebSocketAPIMessageCallback<RealtimeNews>,
  ) {
    this.unsubscribe(`${tenant}_newsticker`, '', onMessage);
  }

  /**
   * Unsubscribe to stations channel.
   * @param {function(data: { content: RealtimeStation })} onMessage The listener callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribe.
   * @public
   */
  unsubscribeStations(
    onMessage?: WebSocketAPIMessageCallback<RealtimeStation>,
  ) {
    this.unsubscribe('station', '', onMessage);
  }

  /**
   * Unsubscribe from stopsequence channel
   *
   * @param {string} id A vehicle id.
   * @param {function(data: { content: RealtimeStopSequence[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @public
   */
  unsubscribeStopSequence(
    id: RealtimeTrainId,
    onMessage?: WebSocketAPIMessageCallback<RealtimeStopSequence[]>,
  ) {
    this.unsubscribe(`stopsequence`, `_${id}`, onMessage);
  }

  /**
   * Unsubscribe from current departures channel.
   * @param {number} stationId UIC of the station.
   * @param {function(data: { content: RealtimeDeparture[] })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @public
   */
  unsubscribeTimetable(
    stationId: RealtimeStationId,
    onMessage?: WebSocketAPIMessageCallback<RealtimeDeparture>,
  ) {
    this.unsubscribe(`timetable_${stationId}`, '', onMessage);
  }

  /**
   * Unsubscribe to trajectory channels.
   * @param {function(data: { content: RealtimeTrajectory })} onMessage Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @public
   */
  unsubscribeTrajectory(
    onMessage: WebSocketAPIMessageCallback<RealtimeTrajectory>,
  ) {
    this.unsubscribe(`trajectory`, '', onMessage);
  }

  /**
   * This callback type is called `requestCallback` and is displayed as a global symbol.
   *
   * @callback onFullTrajectoryMessageCallback
   * @param {number} responseCode
   * @param {string} responseMessage
   */
  /**
   * The bounding box to receive data from.\
   * Example: [minX, minY, maxX, maxY, zoom, mots , gen_level, tenant, ...]\
   * &nbsp;\
   * Where:
   * - **minX**: a string representation of an integer (not a float) representing the minimal X coordinate (in EPSG:3857) of a bounding box\
   * &nbsp;
   * - **minY**: a string representation of an integer (not a float) representing the minimal Y coordinate (in EPSG:3857) of a bounding box\
   * &nbsp;
   * - **maxX**: a string representation of an integer (not a float) representing the maximal X coordinate (in EPSG:3857) of a bounding box\
   * &nbsp;
   * - **maxY**: a string representation of an integer (not a float) representing the maximal Y coordinate (in EPSG:3857) of a bounding box\
   * &nbsp;
   * - **zoom**: a string representation of an integer representing the zoom level (from 4 to 22). When zoom < 8 only the trains are displayed for performance reasons.\
   * &nbsp;
   * - **mots**: A comma separated list of modes of transport. **Optional**.\
   *         Example: "mots=rail,subway".\
   * &nbsp;
   * - **gen_level**: An integer representing the generalization level. **Optional**.\
   *              Example: "gen_level=5"\
   * &nbsp;
   * - **tenant**: A string representing the tenant. **Optional**.\
   *           Example: "tenant=sbb"\
   * &nbsp;
   * - ...: Any other values added to the bbox will be send to the server
   *
   * @type {string[]}
   *
   * @public
   */
  get bbox() {
    return this._bbox;
  }

  set bbox(newBbox) {
    if (JSON.stringify(newBbox) !== JSON.stringify(this._bbox)) {
      this._bbox = newBbox;
      if (this.wsApi && this._bbox) {
        this.wsApi.send(`BBOX ${this._bbox.join(' ')}`);
      }
    }
  }

  get buffer() {
    return this._buffer;
  }

  set buffer(newBuffer) {
    if (JSON.stringify(newBuffer) !== JSON.stringify(this._buffer)) {
      this._buffer = newBuffer;
      if (this.wsApi && this._buffer) {
        this.wsApi.send(`BUFFER ${this._buffer.join(' ')}`);
      }
    }
  }

  get url() {
    return this._url;
  }

  set url(newUrl) {
    if (this._url !== newUrl) {
      this._url = newUrl;

      // Update the websocket only if the url has changed and the websocket is already open or is opening.
      if (this.wsApi.open || this.wsApi.connecting) {
        this.open();
      }
    }
  }
}
export default RealtimeAPI;
