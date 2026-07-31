export declare interface WebSocketAPIMessageEventData<T> {
  additionalProperties?: Map<string, unknown>;
  client_reference: null | string;
  content: null | T;
  source: string;
  timestamp: number;
}

export declare interface WebSocketAPIParameters {
  args?: number | string;
  channel?: string;
  id?: number | string;
}

export declare interface WebSocketAPIRequest<
  T extends WebSocketAPIMessageEventData<unknown>,
> {
  cb: WebSocketAPIMessageCallback<T>;
  errorCb?: EventListener;
  onErrorCb?: EventListener;
  onMessageCb: MessageEventListener;
  params: WebSocketAPIParameters;
  requestString: string;
}

export declare interface WebSocketAPISubscription<
  T extends WebSocketAPIMessageEventData<unknown>,
> {
  cb: WebSocketAPIMessageCallback<T>;
  errorCb?: EventListener;
  onErrorCb?: EventListener;
  onMessageCb: MessageEventListener;
  params: WebSocketAPIParameters;
  quiet: boolean;
}

export type WebSocketAPIMessageCallback<T> = (data: T) => void;

export type MessageEventListener = (evt: MessageEvent<unknown>) => void;

export type WebSocketAPISubscribed = Record<string, boolean>;

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

  requests!: WebSocketAPIRequest<WebSocketAPIMessageEventData<unknown>>[];

  subscribed!: WebSocketAPISubscribed;

  subscriptions!: WebSocketAPISubscription<
    WebSocketAPIMessageEventData<unknown>
  >[];

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
    reqStr += params.args ? ` ${params.args}` : "";
    reqStr += params.id ? ` ${params.id}` : "";
    return reqStr.trim();
  }

  addEvents(onMessage: MessageEventListener, onError?: EventListener) {
    if (this.websocket) {
      this.websocket.addEventListener("message", onMessage);

      if (onError) {
        this.websocket.addEventListener("error", onError);
        this.websocket.addEventListener("close", onError);
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

  connect(url: string, onOpen: () => void) {
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
      this.websocket.addEventListener("open", () => {
        onOpen?.();
        this.subscribePreviousSubscriptions();
      });
    } else {
      onOpen?.();
      this.subscribePreviousSubscriptions();
    }
  }

  defineProperties() {
    Object.defineProperties(this, {
      closed: {
        get: () => {
          return !!(
            !this.websocket ||
            this.websocket.readyState === this.websocket.CLOSED
          );
        },
      },
      closing: {
        get: () => {
          return !!(
            this.websocket &&
            this.websocket.readyState === this.websocket.CLOSING
          );
        },
      },
      connecting: {
        get: () => {
          return !!(
            this.websocket &&
            this.websocket.readyState === this.websocket.CONNECTING
          );
        },
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
        get: () => {
          return !!(
            this.websocket && this.websocket.readyState === this.websocket.OPEN
          );
        },
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
  get<T extends WebSocketAPIMessageEventData<unknown>>(
    params: WebSocketAPIParameters,
    cb: WebSocketAPIMessageCallback<T>,
    errorCb?: EventListener,
  ) {
    const requestString = WebSocketAPI.getRequestString("GET", params);
    this.send(requestString);

    // We wrap the callbacks to make sure they are called only once.
    const once = (callback: EventListener | WebSocketAPIMessageCallback<T>) => {
      return (...args: unknown[]) => {
        (callback as (...a: unknown[]) => void)(...args);
        const index = this.requests.findIndex((request) => {
          return (
            requestString === request.requestString &&
            (cb as unknown as WebSocketAPIMessageCallback<unknown>) ===
              request.cb
          );
        });
        if (index === -1) {
          return;
        }
        const { onErrorCb, onMessageCb } = this.requests[index];
        this.removeEvents(onMessageCb, onErrorCb);
        this.requests.splice(index, 1);
      };
    };

    const { onErrorCb, onMessageCb } = this.listen<T>(
      params,
      once(cb),
      errorCb && once(errorCb),
    );

    // Store requests and callbacks to be able to remove them.
    if (!this.requests) {
      this.requests = [];
    }
    const index = this.requests.findIndex((request) => {
      return (
        requestString === request.requestString &&
        (cb as unknown as WebSocketAPIMessageCallback<unknown>) === request.cb
      );
    });
    const newReq = {
      cb,
      errorCb,
      onErrorCb,
      onMessageCb,
      params,
      requestString,
    } as unknown as WebSocketAPIRequest<WebSocketAPIMessageEventData<unknown>>;
    if (index > -1) {
      this.requests[index] = newReq;
    } else {
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
  listen<T extends WebSocketAPIMessageEventData<unknown>>(
    params: WebSocketAPIParameters,
    cb: WebSocketAPIMessageCallback<T>,
    errorCb?: EventListener,
  ): {
    onErrorCb?: EventListener;
    onMessageCb: MessageEventListener;
  } {
    // Remove the previous identical callback
    this.unlisten(params, cb);

    // We wrap the message callback to be sure we only propagate the message if it is for the right channel.
    const onMessage = (evt: MessageEvent) => {
      let data: T;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data = JSON.parse(evt.data as string);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("WebSocket: unable to parse JSON data", err, evt.data);
        return;
      }
      let source = params.channel;
      source += params.args ? ` ${params.args}` : "";

      // Buffer channel message return a list of other channels to propagate to proper callbacks.
      let contents: T[];

      // In buffer message case, we need to propagate the message to the proper callbacks,
      // because the buffer channel is used as an optimization to send multiple messages at once.
      if (data.source === "buffer") {
        contents = data.content as T[];
      } else {
        contents = [data];
      }
      contents.forEach((content: T) => {
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

  removeEvents(onMessage: MessageEventListener, onError?: EventListener) {
    if (this.websocket) {
      this.websocket.removeEventListener("message", onMessage);

      if (onError) {
        this.websocket.removeEventListener("error", onError);
        this.websocket.removeEventListener("close", onError);
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
        this.websocket.addEventListener("open", () => {
          this.messagesOnOpen = [];
          send();
        });
        this.websocket.addEventListener("close", () => {
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
  subscribe<T extends WebSocketAPIMessageEventData<unknown>>(
    params: WebSocketAPIParameters,
    cb: WebSocketAPIMessageCallback<T>,
    errorCb?: EventListener,
    quiet = false,
  ) {
    const { onErrorCb, onMessageCb } = this.listen(params, cb, errorCb);
    const reqStr = WebSocketAPI.getRequestString("", params);

    const index = this.subscriptions.findIndex((subcr) => {
      return params.channel === subcr.params.channel && cb === subcr.cb;
    });
    const newSubscr = {
      cb,
      errorCb,
      onErrorCb,
      onMessageCb,
      params,
      quiet,
    } as unknown as WebSocketAPISubscription<
      WebSocketAPIMessageEventData<unknown>
    >;
    if (index > -1) {
      this.subscriptions[index] = newSubscr;
    } else {
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
      .filter((s) => {
        return (
          s.params.channel === params.channel &&
          (!cb ||
            s.cb === (cb as unknown as WebSocketAPIMessageCallback<unknown>))
        );
      })
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
    const toRemove = this.subscriptions.filter((s) => {
      return (
        s.params.channel === source &&
        (!cb ||
          s.cb === (cb as unknown as WebSocketAPIMessageCallback<unknown>))
      );
    });

    toRemove.forEach(({ onErrorCb, onMessageCb }) => {
      this.removeEvents(onMessageCb, onErrorCb);
    });

    this.subscriptions = this.subscriptions.filter((s) => {
      return (
        s.params.channel !== source ||
        (cb && s.cb !== (cb as unknown as WebSocketAPIMessageCallback<unknown>))
      );
    });

    // If there is no more subscriptions to this channel, and the removed subscriptions didn't register quietly,
    // we DEL it.
    if (
      source &&
      this.subscribed[source] &&
      !this.subscriptions.find((s) => {
        return s.params.channel === source;
      }) &&
      toRemove.find((subscr) => {
        return !subscr.quiet;
      })
    ) {
      this.send(`DEL ${source}`);
      this.subscribed[source] = false;
    }
  }
}

export default WebSocketAPI;
