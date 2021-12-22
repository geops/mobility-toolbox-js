/**
 * Class used to facilitate connection to a WebSocket and
 * also to manage properly messages send to the WebSocket.
 * This class must not contain any specific implementation.
 *
 * @private
 */
class WebSocketConnector {
  constructor() {
    this.defineProperties();
  }

  defineProperties() {
    Object.defineProperties(this, {
      closed: {
        get: () => {
          return !!(
            this.websocket &&
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
      open: {
        get: () => {
          return !!(
            this.websocket && this.websocket.readyState === this.websocket.OPEN
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
      /**
       * Array of subscriptions.
       * @type {Array<subscription>}
       * @private
       */
      subscriptions: {
        value: [],
        writable: true,
      },

      /**
       * List of channels subscribed.
       * @type {Array<subscription>}
       * @private
       */
      subscribed: {
        value: {},
        writable: true,
      },
    });
  }

  /**
   * Get the websocket request string.
   *
   * @param {string} method Request mehtod {GET, SUB}.
   * @param {Object} params Request parameters.
   * @param {string} params.channel Channel name
   * @param {string} [params.args] Request arguments
   * @param {Number} [params.id] Request identifier
   * @returns {string} request string
   * @private
   */
  static getRequestString(method, params) {
    let reqStr = `${method} ${params.channel}`;
    reqStr += params.args ? ` ${params.args}` : '';
    reqStr += params.id ? ` ${params.id}` : '';
    return reqStr.trim();
  }

  /**
   * (Re)connect the websocket.
   *
   * @private
   */
  connect(url) {
    if (this.websocket && !this.closed) {
      this.websocket.close();
    }

    /** @ignore */
    this.websocket = new WebSocket(url);

    if (!this.open) {
      this.websocket.addEventListener('open', () => {
        this.subscribePreviousSubscriptions();
      });
    } else {
      this.subscribePreviousSubscriptions();
    }
  }

  /**
   * Close the websocket definitively.
   *
   * @private
   */
  close() {
    if (this.websocket) {
      this.websocket.onclose = null;
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Sends a message to the websocket.
   *
   * @param {message} message Message to send.
   * @private
   */
  send(message) {
    if (!this.websocket) {
      return;
    }
    const send = () => {
      this.websocket.send(message);
    };
    if (!this.open) {
      // This 'if' avoid sending 2 identical BBOX message on open,
      if (!this.messagesOnOpen.includes(message)) {
        this.messagesOnOpen.push(message);
        this.websocket.addEventListener('open', () => {
          this.messagesOnOpen = [];
          send();
        });
      }
    } else if (!this.messagesOnOpen.includes(message)) {
      send();
    }
  }

  /**
   * Listen to websocket messages.
   *
   * @param {Object} params Parameters for the websocket get request
   * @param {function} cb callback on listen
   * @param {function} errorCb Callback on error
   * @returns {{onMessage: function, errorCb: function}} Object with onMessage and error callbacks
   * @private
   */
  listen(params, cb, errorCb) {
    // Remove the previous identical callback
    this.unlisten(params, cb);

    const onMessage = (evt) => {
      const data = JSON.parse(evt.data);
      let source = params.channel;
      source += params.args ? ` ${params.args}` : '';

      if (
        data.source === source &&
        (!params.id || params.id === data.client_reference)
      ) {
        cb(data);
      }
    };

    if (this.websocket) {
      this.websocket.addEventListener('message', onMessage);

      if (errorCb) {
        this.websocket.addEventListener('error', errorCb);
        this.websocket.addEventListener('close', errorCb);
      }
    }

    return { onMessageCb: onMessage, onErrorCb: errorCb };
  }

  /**
   * Unlisten websocket messages.
   *
   * @param {Object} params Parameters for the websocket get request.
   * @param {function} cb Callback used when listen.
   * @private
   */
  unlisten(params, cb) {
    if (!this.websocket) {
      return;
    }
    this.subscriptions
      .filter((s) => {
        return s.params.channel === params.channel && (!cb || s.cb === cb);
      })
      .forEach(({ onMessageCb, onErrorCb }) => {
        if (this.websocket) {
          this.websocket.removeEventListener('message', onMessageCb);
          if (onErrorCb) {
            this.websocket.removeEventListener('error', onErrorCb);
            this.websocket.removeEventListener('close', onErrorCb);
          }
        }
      });
  }

  /**
   * Sends a get request to the websocket.
   *
   * @param {Object} params Parameters for the websocket get request
   * @param {function} cb callback on listen
   * @param {function} errorCb Callback on error
   * @private
   */
  get(params, cb, errorCb) {
    const reqStr = WebSocketConnector.getRequestString('GET', params);
    this.send(reqStr);
    this.listen(params, cb, errorCb);
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
  subscribe(params, cb, errorCb, quiet = false) {
    const { onMessageCb, onErrorCb } = this.listen(params, cb, errorCb);
    const reqStr = WebSocketConnector.getRequestString('', params);

    const index = this.subscriptions.findIndex((subcr) => {
      return params.channel === subcr.params.channel && cb === subcr.cb;
    });
    const newSubscr = { params, cb, errorCb, onMessageCb, onErrorCb, quiet };
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
   * Unsubscribe from a channel.
   * @param {string} source source to unsubscribe from
   * @param {function} cb Callback function to unsubscribe. If null all subscriptions for the channel will be unsubscribed.
   * @private
   */
  unsubscribe(source, cb) {
    const toRemove = this.subscriptions.filter((s) => {
      return s.params.channel === source && (!cb || s.cb === cb);
    });

    toRemove.forEach(({ onMessageCb, onErrorCb }) => {
      if (this.websocket) {
        this.websocket.removeEventListener('message', onMessageCb);
        if (onErrorCb) {
          this.websocket.removeEventListener('error', onErrorCb);
          this.websocket.removeEventListener('close', onErrorCb);
        }
      }
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

  /**
   * After an auto reconnection we need to re-subscribe to the channels.
   */
  subscribePreviousSubscriptions() {
    // Subscribe all previous subscriptions.
    [...this.subscriptions].forEach((s) => {
      this.subscribe(s.params, s.cb, s.errorCb, s.quiet);
    });
  }
}

export default WebSocketConnector;
