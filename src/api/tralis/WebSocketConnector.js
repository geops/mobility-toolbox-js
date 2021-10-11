/**
 * Class use to facilitate connection to a WebSocket
 * @private
 */
class WebSocketConnector {
  constructor(url) {
    /**
     * Array of subscriptions.
     * @type {Array<subscription>}
     */
    this.subscriptions = [];
    this.connect(url);

    // keep websocket alive
    setInterval(() => {
      this.send('PING');
    }, 10000);
    this.subscribed = {};
  }

  /**
   * Get the websocket request string.
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
   * @param {string} url url to connect to
   * @private
   */
  connect(url) {
    if (this.websocket && this.websocket.readyState !== this.websocket.CLOSED) {
      this.websocket.close();
    }

    /** @ignore */
    this.websocket = new WebSocket(url);

    if (this.currentProj) {
      this.setProjection(this.currentProj);
    }

    if (this.currentBbox) {
      this.setBbox(this.currentBbox);
    }

    [...this.subscriptions].forEach((s) => {
      this.subscribe(s.params, s.cb, s.errorCb, true);
    });

    // reconnect on close
    this.websocket.onclose = () => {
      window.clearTimeout(this.reconnectTimeout);
      /** @ignore */
      this.reconnectTimeout = window.setTimeout(() => this.connect(url), 100);
    };
  }

  /**
   * Sends a get request to the websocket.
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
   * Sends a message to the websocket.
   * @param {message} message Message to send.
   * @private
   */
  send(message) {
    const send = () => {
      this.websocket.send(message);
    };

    if (this.websocket.readyState === WebSocket.CONNECTING) {
      this.websocket.addEventListener('open', send);
    } else {
      send();
    }
  }

  /**
   * Set the projection for websocket responses.
   * @param {string} value projection value to be set
   * @private
   */
  setProjection(value) {
    /**
     * The projection for websocket responses
     * @type {string}
     */
    this.currentProj = value;
    this.send(`PROJECTION ${value}`);
  }

  /**
   * Set the BBOX for websocket responses.
   *  @param {Array<Array<number>>} coordinates array of coordinates
   * @private
   */
  setBbox(coordinates) {
    /**
     * The BBOX for websocket responses
     * @type {Array<Array<number>>}
     */
    this.currentBbox = coordinates;
    this.send(`BBOX ${coordinates.join(' ')}`);
    this.subscriptions.forEach((s) => {
      this.get(s.params, s.cb, s.errorCb);
    });
  }

  /**
   * Listen to websocket responses.
   * @private
   * @param {Object} params Parameters for the websocket get request
   * @param {function} cb callback on listen
   * @param {function} errorCb Callback on error
   * @returns {{onMessage: function, errorCb: function}} Object with onMessage and error callbacks
   */
  listen(params, cb, errorCb) {
    // Remove the previous identical callback
    this.unlisten(params, cb);

    const onMessage = (e) => {
      const data = JSON.parse(e.data);
      let source = params.channel;
      source += params.args ? ` ${params.args}` : '';

      if (
        data.source === source &&
        (!params.id || params.id === data.client_reference)
      ) {
        cb(data);
      }
    };

    this.websocket.addEventListener('message', onMessage);

    if (errorCb) {
      this.websocket.addEventListener('error', errorCb);
      this.websocket.addEventListener('close', errorCb);
    }

    return { onMessageCb: onMessage, onErrorCb: errorCb };
  }

  unlisten(params, cb) {
    this.subscriptions
      .filter((s) => {
        return s.params.channel === params.channel && (!cb || s.cb === cb);
      })
      .forEach(({ onMessageCb, onErrorCb }) => {
        this.websocket.removeEventListener('message', onMessageCb);
        if (onErrorCb) {
          this.websocket.removeEventListener('error', onErrorCb);
          this.websocket.removeEventListener('close', onErrorCb);
        }
      });
  }

  /**
   * Subscribe to a given channel.
   * @private
   * @param {Object} params Parameters for the websocket get request
   * @param {function} cb callback on listen
   * @param {function} errorCb Callback on error
   * @param {boolean} quiet if subscribe should be quiet
   */
  subscribe(params, cb, errorCb, quiet) {
    const { onMessageCb, onErrorCb } = this.listen(params, cb, errorCb);
    const reqStr = WebSocketConnector.getRequestString('', params);

    if (!quiet) {
      const index = this.subscriptions.findIndex((subcr) => {
        return params.channel === subcr.params.channel && cb === subcr.cb;
      });
      const newSubscr = { params, cb, errorCb, onMessageCb, onErrorCb };
      if (index > -1) {
        this.subscriptions[index] = newSubscr;
      } else {
        this.subscriptions.push(newSubscr);
      }
    }

    if (!this.subscribed[reqStr]) {
      this.send(`GET ${reqStr}`);
      this.send(`SUB ${reqStr}`);
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
    this.subscriptions
      .filter((s) => {
        return s.params.channel === source && (!cb || s.cb === cb);
      })
      .forEach(({ onMessageCb, onErrorCb }) => {
        this.websocket.removeEventListener('message', onMessageCb);
        if (onErrorCb) {
          this.websocket.removeEventListener('error', onErrorCb);
          this.websocket.removeEventListener('close', onErrorCb);
        }
      });

    this.subscriptions = this.subscriptions.filter(
      (s) => s.params.channel !== source || (cb && s.cb !== cb),
    );

    // If there is no more subscriptions to this channel we DEL it.
    if (
      source &&
      this.subscribed[source] &&
      !this.subscriptions.find((s) => s.params.channel === source)
    ) {
      this.send(`DEL ${source}`);
      this.subscribed[source] = false;
    }
  }
}

export default WebSocketConnector;
