import { RealtimeTrajectoryResponse } from '../types';

export declare interface WebSocketAPIParameters {
  args?: number | string;
  channel?: string;
  id?: number | string;
}

export declare interface WebSocketAPIMessageEventData<T> {
  // | RealtimeFullTrajectory;
  client_reference: null | number | string;
  content: T;
  source: string;
  // | T
  // | string
  // | Feature
  // | RealtimeTrajectoryResponse[]
  // | RealtimeDeparture
  // | RealtimeNews[]
  // | RealtimeStation
  // | RealtimeExtraGeom
  // | RealtimeTrajectory
  // | RealtimeStopSequence[]
  timestamp: number;
}

export type WebSocketAPIBufferMessageEventData = {
  source: 'buffer';
} & WebSocketAPIMessageEventData<RealtimeTrajectoryResponse[]>;

export type WebSocketAPIMessageEvent = {
  data: string;
} & Event;

export type WebSocketAPIMessageEventListener = (
  evt: WebSocketAPIMessageEvent,
) => void;

/**
 * This type represents a function that has been call with each feature returned by the websocket.
 */
export type WebSocketAPIMessageCallback<T> = (
  data: WebSocketAPIMessageEventData<T>,
) => void;

export declare interface WebSocketAPISubscription<T> {
  cb: WebSocketAPIMessageCallback<T>;
  errorCb?: EventListener;
  onErrorCb?: EventListener;
  onMessageCb: WebSocketAPIMessageEventListener;
  params: WebSocketAPIParameters;
  quiet: boolean;
}

export type WebSocketAPISubscribed = Record<string, boolean>;

export declare interface WebSocketAPIRequest<T> {
  cb: WebSocketAPIMessageCallback<T>;
  errorCb?: EventListener;
  onErrorCb?: EventListener;
  onMessageCb: WebSocketAPIMessageEventListener;
  params: WebSocketAPIParameters;
  requestString: string;
}
/**
 * Class used to facilitate connection to a WebSocketAPI and
 * also to manage properly messages send to the WebSocketAPI.
 * This class must not contain any specific implementation.
 * @private
 */
class WebSocketAPI {
  closed?: boolean;

  closing?: boolean;

  connecting?: boolean;

  messagesOnOpen!: string[];

  open?: boolean;

  requests!: WebSocketAPIRequest<unknown>[];

  subscribed!: WebSocketAPISubscribed;

  subscriptions!: WebSocketAPISubscription<unknown>[];

  websocket?: WebSocket;

  constructor() {
    this.defineProperties();
  }

  /**
   * Get the websocket request string.
   *
   * @param {string} method Request mehtod {GET, SUB}.
   * @param {WebSocketParameters} params Request parameters.
   * @param {string} params.channel Channel name
   * @param {string} [params.args] Request arguments
   * @param {Number|string} [params.id] Request identifier
   * @return {string} request string
   * @private
   */
  static getRequestString(method: string, params: WebSocketAPIParameters = {}) {
    let reqStr = `${method} ${params.channel}`;
    reqStr += params.args ? ` ${params.args}` : '';
    reqStr += params.id ? ` ${params.id}` : '';
    return reqStr.trim();
  }

  addEvents(
    onMessage: WebSocketAPIMessageEventListener,
    onError?: EventListener,
  ) {
    if (this.websocket) {
      this.websocket.addEventListener('message', onMessage);

      if (onError) {
        this.websocket.addEventListener('error', onError);
        this.websocket.addEventListener('close', onError);
      }
    }
  }

  /**
   * Close the websocket definitively.
   *
   * @private
   */
  close() {
    if (this.websocket && (this.open || this.connecting)) {
      this.websocket.onclose = () => {};
      this.websocket.close();
      this.messagesOnOpen = [];
    }
  }

  /**
   * (Re)connect the websocket.
   *
   * @param {string} url Websocket url.
   * @param {function} onOpen Callback called when the websocket connection is opened and before subscriptions of previous subscriptions.
   * @private
   */
  connect(url: string, onOpen = () => {}) {
    // if no url specify, close the current websocket and do nothing.
    if (!url) {
      this.websocket?.close();
      return;
    }

    // Behavior when a websocket already exists.
    if (this.websocket) {
      // If the current websocket has the same url and is open or is connecting, do nothing.
      if (this.websocket.url === url && (this.open || this.connecting)) {
        return;
      }

      // If the current websocket has not the same url and is open or is connecting, close it.
      if (this.websocket.url !== url && (this.open || this.connecting)) {
        this.websocket.close();
      }
    }

    this.websocket = new WebSocket(url);

    if (!this.open) {
      this.websocket.addEventListener('open', () => {
        onOpen();
        this.subscribePreviousSubscriptions();
      });
    } else {
      onOpen();
      this.subscribePreviousSubscriptions();
    }
  }

  defineProperties() {
    Object.defineProperties(this, {
      closed: {
        get: () =>
          !!(
            !this.websocket ||
            this.websocket.readyState === this.websocket.CLOSED
          ),
      },
      closing: {
        get: () =>
          !!(
            this.websocket &&
            this.websocket.readyState === this.websocket.CLOSING
          ),
      },
      connecting: {
        get: () =>
          !!(
            this.websocket &&
            this.websocket.readyState === this.websocket.CONNECTING
          ),
      },
      /**
       * Array of message to send on open.
       * @type {Array<string>}
       * @private
       */
      messagesOnOpen: {
        value: [],
        writable: true,
      },
      open: {
        get: () =>
          !!(
            this.websocket && this.websocket.readyState === this.websocket.OPEN
          ),
      },
      /**
       * List of channels subscribed.
       * @type {WebSocketSubscribed}
       * @private
       */
      subscribed: {
        value: {},
        writable: true,
      },

      /**
       * Array of subscriptions.
       * @type {Array<WebSocketSubscription>}
       * @private
       */
      subscriptions: {
        value: [],
        writable: true,
      },
    });
  }

  /**
   * Sends a get request to the websocket.
   * The callback is called only once, when the response is received or when the call returns an error.
   *
   * @param {Object} params Parameters for the websocket get request
   * @param {function} cb callback on message event
   * @param {function} errorCb Callback on error and close event
   * @private
   */
  get<T>(
    params: WebSocketAPIParameters,
    cb: WebSocketAPIMessageCallback<T>,
    errorCb?: EventListener,
  ) {
    const requestString = WebSocketAPI.getRequestString('GET', params);
    this.send(requestString);

    // We wrap the callbacks to make sure they are called only once.
    const once =
      (callback: EventListener | WebSocketAPIMessageCallback<T>) =>
      // @ts-expect-error : Spread error
      (...args) => {
        // @ts-expect-error : Spread error
        callback(...args);
        const index = this.requests.findIndex(
          (request) =>
            requestString === request.requestString && cb === request.cb,
        );
        const { onErrorCb, onMessageCb } = this.requests[index];
        this.removeEvents(onMessageCb, onErrorCb);
        this.requests.splice(index, 1);
      };

    const { onErrorCb, onMessageCb } = this.listen(
      params,
      once(cb),
      errorCb && once(errorCb),
    );

    // Store requests and callbacks to be able to remove them.
    if (!this.requests) {
      this.requests = [];
    }
    const index = this.requests.findIndex(
      (request) => requestString === request.requestString && cb === request.cb,
    );
    const newReq = {
      cb,
      errorCb,
      onErrorCb,
      onMessageCb,
      params,
      requestString,
    };
    if (index > -1) {
      // @ts-expect-error - We know that the requests is an array of WebSocketAPIRequest
      this.requests[index] = newReq;
    } else {
      // @ts-expect-error - We know that the requests is an array of WebSocketAPIRequest
      this.requests.push(newReq);
    }
  }

  /**
   * Listen to websocket messages.
   *
   * @param {WebSocketParameters} params Parameters for the websocket get request
   * @param {function} cb callback on listen
   * @param {function} errorCb Callback on error
   * @return {{onMessage: function, errorCb: function}} Object with onMessage and error callbacks
   * @private
   */
  listen<T>(
    params: WebSocketAPIParameters,
    cb: WebSocketAPIMessageCallback<T>,
    errorCb?: EventListener,
  ): {
    onErrorCb?: EventListener;
    onMessageCb: WebSocketAPIMessageEventListener;
  } {
    // Remove the previous identical callback
    this.unlisten(params, cb);

    // We wrap the message callback to be sure we only propagate the message if it is for the right channel.
    const onMessage: WebSocketAPIMessageEventListener = (
      evt: WebSocketAPIMessageEvent,
    ) => {
      let data: WebSocketAPIMessageEventData<T>;
      try {
        data = JSON.parse(evt.data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('WebSocket: unable to parse JSON data', err, evt.data);
        return;
      }
      let source = params.channel;
      source += params.args ? ` ${params.args}` : '';

      // Buffer channel message return a list of other channels to propagate to proper callbacks.
      let contents: WebSocketAPIMessageEventData<T>[];

      if (data.source === 'buffer') {
        // @ts-expect-error - We know that the data is a WebSocketAPIBufferMessageEventData
        contents = (data as unknown as WebSocketAPIBufferMessageEventData)
          .content;
      } else {
        contents = [data];
      }
      contents.forEach((content: WebSocketAPIMessageEventData<T>) => {
        // Because of backend optimization, the last content is null.
        if (
          content?.source === source &&
          (!params.id || params.id === data.client_reference)
        ) {
          cb(content);
        }
      });
    };

    this.addEvents(onMessage, errorCb);

    return { onErrorCb: errorCb, onMessageCb: onMessage };
  }

  removeEvents(
    onMessage: WebSocketAPIMessageEventListener,
    onError?: EventListener,
  ) {
    if (this.websocket) {
      this.websocket.removeEventListener('message', onMessage);

      if (onError) {
        this.websocket.removeEventListener('error', onError);
        this.websocket.removeEventListener('close', onError);
      }
    }
  }

  /**
   * Sends a message to the websocket.
   *
   * @param {message} message Message to send.
   * @private
   */
  send(message: string) {
    if (!this.websocket || this.closed || this.closing) {
      return;
    }
    const send = () => {
      this.websocket?.send(message);
    };
    if (!this.open) {
      // This 'if' avoid sending 2 identical BBOX message on open,
      if (!this.messagesOnOpen.includes(message)) {
        this.messagesOnOpen.push(message);
        this.websocket.addEventListener('open', () => {
          this.messagesOnOpen = [];
          send();
        });
        this.websocket.addEventListener('close', () => {
          this.messagesOnOpen = [];
        });
      }
    } else if (!this.messagesOnOpen.includes(message)) {
      send();
    }
  }

  /**
   * Subscribe to a given channel.
   *
   * @param {Object} params Parameters for the websocket get request
   * @param {function} cb callback on listen
   * @param {function} errorCb Callback on error
   * @param {boolean} quiet if false, no GET or SUB requests are send, only the callback is registered.
   * @private
   */
  subscribe<T>(
    params: WebSocketAPIParameters,
    cb: WebSocketAPIMessageCallback<T>,
    errorCb?: EventListener,
    quiet = false,
  ) {
    const { onErrorCb, onMessageCb } = this.listen(params, cb, errorCb);
    const reqStr = WebSocketAPI.getRequestString('', params);

    const index = this.subscriptions.findIndex(
      (subcr) => params.channel === subcr.params.channel && cb === subcr.cb,
    );
    const newSubscr = { cb, errorCb, onErrorCb, onMessageCb, params, quiet };
    if (index > -1) {
      // @ts-expect-error - We know that the subscriptions is an array of WebSocketAPISubscription
      this.subscriptions[index] = newSubscr;
    } else {
      // @ts-expect-error - We know that the subscriptions is an array of WebSocketAPISubscription
      this.subscriptions.push(newSubscr);
    }

    if (!this.subscribed[reqStr]) {
      if (!newSubscr.quiet) {
        this.send(`GET ${reqStr}`);
        this.send(`SUB ${reqStr}`);
      }
      this.subscribed[reqStr] = true;
    }
  }

  /**
   * After an auto reconnection we need to re-subscribe to the channels.
   */
  subscribePreviousSubscriptions() {
    // Before to subscribe previous subscriptions we make sure they
    // are all defined as unsubscribed, because this code is asynchrone
    // and a subscription could have been added in between.
    Object.keys(this.subscribed).forEach((key) => {
      this.subscribed[key] = false;
    });

    // Subscribe all previous subscriptions.
    [...this.subscriptions].forEach((s) => {
      this.subscribe(s.params, s.cb, s.errorCb, s.quiet);
    });
  }

  /**
   * Unlisten websocket messages.
   *
   * @param {Object} params Parameters for the websocket get request.
   * @param {function} cb Callback used when listen.
   * @private
   */
  unlisten<T>(
    params: WebSocketAPIParameters,
    cb: WebSocketAPIMessageCallback<T>,
  ) {
    [...(this.subscriptions || []), ...(this.requests || [])]
      .filter(
        (s) => s.params.channel === params.channel && (!cb || s.cb === cb),
      )
      .forEach(({ onErrorCb, onMessageCb }) => {
        this.removeEvents(onMessageCb, onErrorCb);
      });
  }

  /**
   * Unsubscribe from a channel.
   * @param {string} source source to unsubscribe from
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @private
   */
  unsubscribe<T>(source: string, cb?: WebSocketAPIMessageCallback<T>) {
    const toRemove = this.subscriptions.filter(
      (s) => s.params.channel === source && (!cb || s.cb === cb),
    );

    toRemove.forEach(({ onErrorCb, onMessageCb }) => {
      this.removeEvents(onMessageCb, onErrorCb);
    });

    this.subscriptions = this.subscriptions.filter(
      (s) => s.params.channel !== source || (cb && s.cb !== cb),
    );

    // If there is no more subscriptions to this channel, and the removed subscriptions didn't register quietly,
    // we DEL it.
    if (
      source &&
      this.subscribed[source] &&
      !this.subscriptions.find((s) => s.params.channel === source) &&
      toRemove.find((subscr) => !subscr.quiet)
    ) {
      this.send(`DEL ${source}`);
      this.subscribed[source] = false;
    }
  }
}

export default WebSocketAPI;
