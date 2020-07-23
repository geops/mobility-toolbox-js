class WebSocketConnector {
  constructor(url) {
    this.subscriptions = [];
    this.connect(url);

    // keep websocket alive
    setInterval(() => {
      this.send('PING');
    }, 10000);
  }

  /**
   * Get the websocket request string.
   * @param {string} method Request mehtod {GET, SUB}.
   * @param {Object} params Request parameters.
   * @param {string} params.channel Channel name
   * @param {string} [params.args] Request arguments
   * @param {Number} [params.id] Request identifier
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
   * @private
   */
  connect(url) {
    if (this.websocket && this.websocket.readyState !== this.websocket.CLOSED) {
      this.websocket.close();
    }

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
      this.reconnectTimeout = window.setTimeout(() => this.connect(), 100);
    };
  }

  /**
   * Sends a get request to the websocket.
   * @private
   */
  get(params, cb, errorCb) {
    const reqStr = WebSocketConnector.getRequestString('GET', params);
    this.send(reqStr);
    this.listen(params, cb, errorCb);
  }

  /**
   * Sends a message to the websocket.
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
   * @private
   */
  setProjection(value) {
    this.currentProj = value;
    this.send(`PROJECTION ${value}`);
  }

  /**
   * Set the BBOX for websocket responses.
   * @private
   */
  setBbox(coordinates) {
    this.currentBbox = coordinates;
    this.send(`BBOX ${coordinates.join(' ')}`);
    this.subscriptions.forEach((s) => {
      this.get(s.params, s.cb, s.errorCb);
    });
  }

  /**
   * Listen to websocket responses.
   * @private
   */
  listen(params, cb, errorCb) {
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

    return { onMessage, onErrorCb: errorCb };
  }

  /**
   * Subscribe to a given channel.
   * @private
   */
  subscribe(params, cb, errorCb, quiet) {
    const { onMessageCb, onErrorCb } = this.listen(params, cb, errorCb);
    const reqStr = WebSocketConnector.getRequestString('', params);

    if (!quiet) {
      this.subscriptions.push({ params, cb, errorCb, onMessageCb, onErrorCb });
    }

    this.send(`GET ${reqStr}`);
    this.send(`SUB ${reqStr}`);
  }

  /**
   * Unsubscribe from a channel.
   * @private
   */
  unsubscribe(source) {
    this.subscriptions
      .filter((s) => s.params.channel === source)
      .forEach(({ onMessageCb, onErrorCb }) => {
        this.websocket.removeEventListener('message', onMessageCb);
        if (onErrorCb) {
          this.websocket.removeEventListener('error', onErrorCb);
          this.websocket.removeEventListener('close', onErrorCb);
        }
      });

    this.subscriptions = this.subscriptions.filter(
      (s) => s.params.channel !== source,
    );

    if (source) {
      this.send(`DEL ${source}`);
    }
  }
}

export default WebSocketConnector;
