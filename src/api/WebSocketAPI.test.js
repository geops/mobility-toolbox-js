import WS from 'jest-websocket-mock';

import WebSocketAPI from './WebSocketAPI';

describe('WebSocketAPI', () => {
  let server;
  let server2;

  beforeEach(() => {
    server = new WS(`ws://foo:1234`);
    server2 = new WS(`ws://foo:12345`);
  });

  afterEach(() => {
    server.close();
    server2.close();
    WS.clean();
  });

  describe('#constructor', () => {
    test("doesn't connect.", () => {
      const client = new WebSocketAPI();
      expect(client.websocket).toBe();
      expect(client.closed).toBe(true);
      expect(client.closing).toBe(false);
      expect(client.connecting).toBe(false);
      expect(client.open).toBe(false);
    });
  });

  describe('#close', () => {
    test('should close the websocket and clear some property', async () => {
      const client = new WebSocketAPI();
      const subsc2 = {
        cb: () => {},
        errorCb: () => {},
        params: 'foo',
        quiet: false,
      };
      client.subscriptions = [subsc2];
      client.messagesOnOpen = ['GET foo'];
      client.connect(`ws://foo:1234`);
      client.websocket.addEventListener = jest.fn();
      client.websocket.removeEventListener = jest.fn();
      // client.websocket.close = jest.fn();
      await server.connected;
      expect(client.websocket).toBeDefined();
      expect(client.messagesOnOpen).toEqual(['GET foo']);
      client.close();
      expect(client.messagesOnOpen).toEqual([]);
      await server.closed;
      expect(client.closed).toBe(true);
    });
  });

  describe('#connect', () => {
    test('create a new WebSocket.', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      client.send('hello');
      await expect(server).toReceiveMessage('hello');
      expect(server).toHaveReceivedMessages(['hello']);
    });

    test('close previous connection.', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      expect(client.websocket).toBeDefined();
      const old = client.websocket;
      expect(old.readyState).toBe(WebSocket.OPEN);
      client.connect(`ws://foo:12345`);
      expect(old.readyState).toBe(WebSocket.CLOSING);
      expect(client.websocket.readyState).toBe(WebSocket.CONNECTING);
    });

    test('call onOpen function', async () => {
      const onOpen = jest.fn();
      const client = new WebSocketAPI();
      client.subscribe = jest.fn();
      client.connect(`ws://foo:1234`, onOpen);
      await server.connected;
      expect(client.websocket.readyState).toBe(WebSocket.OPEN);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    test('subscribe previous subscriptions on open (quiet or not)', async () => {
      const client = new WebSocketAPI();
      client.subscribe = jest.fn();
      client.send = jest.fn();
      const subsc = {
        cb: () => {},
        errorCb: () => {},
        params: 'foo',
        quiet: true,
      };
      const subsc2 = {
        cb: () => {},
        errorCb: () => {},
        params: 'foo',
        quiet: false,
      };
      client.subscriptions = [subsc, subsc2];

      client.connect(`ws://foo:1234`);
      await server.connected;
      expect(client.websocket.readyState).toBe(WebSocket.OPEN);
      expect(client.subscribe).toHaveBeenCalledTimes(2);
      client.subscribe.mockReset();

      client.connect(`ws://foo:12345`);
      await server2.connected;
      expect(client.websocket.readyState).toBe(WebSocket.OPEN);
      expect(client.subscribe).toHaveBeenCalledTimes(2);
      expect(client.subscribe).toHaveBeenCalledWith(
        subsc.params,
        subsc.cb,
        subsc.errorCb,
        subsc.quiet,
      );
    });

    test('send GET and SUB for not quiet previous subscriptions', async () => {
      const client = new WebSocketAPI();
      client.send = jest.fn();
      const subsc = {
        cb: () => {},
        errorCb: () => {},
        params: { channel: 'foo' },
        quiet: false,
      };
      client.subscriptions = [subsc];

      client.connect(`ws://foo:1234`);
      client.websocket.addEventListener = jest.fn();
      client.websocket.removeEventListener = jest.fn();
      await server.connected;
      expect(client.websocket.readyState).toBe(WebSocket.OPEN);
      expect(client.send).toHaveBeenCalledTimes(2);
      expect(client.send.mock.calls[0]).toEqual(['GET foo']);
      expect(client.send.mock.calls[1]).toEqual(['SUB foo']);
      client.send.mockReset();

      client.connect(`ws://foo:12345`);
      client.websocket.addEventListener = jest.fn();
      client.websocket.removeEventListener = jest.fn();
      await server2.connected;
      expect(client.websocket.readyState).toBe(WebSocket.OPEN);
      // not quiet subscriptions will send GET and SUB requests.
      expect(client.send).toHaveBeenCalledTimes(2);
      expect(client.send.mock.calls[0]).toEqual(['GET foo']);
      expect(client.send.mock.calls[1]).toEqual(['SUB foo']);
    });

    test('doesn\t send GET and SUB for quiet previous subscriptions', async () => {
      const client = new WebSocketAPI();
      client.send = jest.fn();
      const subsc = {
        cb: () => {},
        errorCb: () => {},
        params: { channel: 'foo' },
        quiet: true,
      };
      client.subscriptions = [subsc];

      client.connect(`ws://foo:1234`);
      client.websocket.addEventListener = jest.fn();
      client.websocket.removeEventListener = jest.fn();
      await server.connected;
      expect(client.websocket.readyState).toBe(WebSocket.OPEN);
      expect(client.send).toHaveBeenCalledTimes(0);
      client.send.mockReset();

      client.connect(`ws://foo:12345`);
      client.websocket.addEventListener = jest.fn();
      client.websocket.removeEventListener = jest.fn();
      await server2.connected;
      expect(client.websocket.readyState).toBe(WebSocket.OPEN);
      // not quiet subscriptions will send GET and SUB requests.
      expect(client.send).toHaveBeenCalledTimes(0);
    });
  });

  describe('#get', () => {
    test('listen to message event', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      const params = { args: ['baz'], channel: 'get', id: 'id' };
      const cb = jest.fn();
      const errorCb = jest.fn();
      client.get(params, cb, errorCb);

      expect(cb).toHaveBeenCalledTimes(0);
      const obj = { client_reference: 'id', source: 'get baz' };
      server.send(JSON.stringify(obj));
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(obj);
    });

    test('unlisten after receiving one response', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      const params = { args: ['baz'], channel: 'get', id: 'id' };
      const cb = jest.fn();
      const errorCb = jest.fn();
      client.get(params, cb, errorCb);

      expect(cb).toHaveBeenCalledTimes(0);
      const obj = { client_reference: 'id', source: 'get baz' };
      server.send(JSON.stringify(obj));
      expect(cb).toHaveBeenCalledTimes(1);
      server.send(JSON.stringify(obj));
      server.send(JSON.stringify(obj));
      server.send(JSON.stringify(obj));
      server.send(JSON.stringify(obj));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    test('call (then remove) good callbacks on multiple requests', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      const params = { args: ['baz'], channel: 'get', id: 'id' };
      const cb = jest.fn();
      const errorCb = jest.fn();
      client.get(params, cb, errorCb);

      const params2 = { args: ['foo'], channel: 'get', id: 'id' };
      const cb2 = jest.fn();
      const errorCb2 = jest.fn();
      client.get(params2, cb2, errorCb2);
      client.get(params, cb2, errorCb);

      expect(cb).toHaveBeenCalledTimes(0);
      const obj = { client_reference: 'id', source: 'get baz' };
      server.send(JSON.stringify(obj));
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      server.send(
        JSON.stringify({ client_reference: 'id', source: 'get foo' }),
      );
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(2);
    });
  });

  describe('#subscribe', () => {
    test('adds subscription to subscriptions array', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      const params = { args: ['baz'], channel: 'bar', id: 'id' };
      const cb = jest.fn();
      const errorCb = jest.fn();
      client.subscribe(params, cb, errorCb);
      expect(client.subscriptions.length).toBe(1);
      expect(client.subscriptions[0].params).toBe(params);
      expect(client.subscriptions[0].cb).toBe(cb);
      expect(client.subscriptions[0].errorCb).toBe(errorCb);
      expect(client.subscriptions[0].quiet).toBe(false);

      const obj = { client_reference: 'id', source: 'bar baz' };
      server.send(JSON.stringify(obj));

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(obj);
    });

    test("doesn't duplicate subscriptions", async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      const params = { args: ['baz'], channel: 'bar', id: 'id' };
      const cb = jest.fn();
      const errorCb = jest.fn();
      client.subscribe(params, cb, errorCb, true);
      client.subscribe(params, cb, errorCb, true);
      expect(client.subscriptions.length).toBe(1);

      const obj = { client_reference: 'id', source: 'bar baz' };
      server.send(JSON.stringify(obj));

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(obj);
    });

    test('send GET and SUB requests.', () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      client.send = jest.fn();
      const params = { args: ['baz'], channel: 'bar', id: 'id' };
      const cb = jest.fn();
      const errorCb = jest.fn();
      client.subscribe(params, cb, errorCb);
      expect(client.send).toHaveBeenCalledTimes(2);
      expect(client.send).toHaveBeenCalledWith('GET bar baz id');
      expect(client.send).toHaveBeenCalledWith('SUB bar baz id');
      client.send.mockRestore();
    });

    test('should register callback without sending GET and SUB requests (quiet=true).', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      const params = { args: ['baz'], channel: 'bar', id: 'id' };
      const cb = jest.fn();
      const errorCb = jest.fn();
      client.send = jest.fn();
      client.subscribe(params, cb, errorCb, true);
      expect(client.subscriptions.length).toBe(1);
      expect(client.subscriptions[0].params).toBe(params);
      expect(client.subscriptions[0].cb).toBe(cb);
      expect(client.subscriptions[0].errorCb).toBe(errorCb);
      expect(client.subscriptions[0].quiet).toBe(true);
      expect(client.send).toHaveBeenCalledTimes(0);
      client.send.mockRestore();
    });
  });

  describe('#unsubscribe', () => {
    test('should only unsubscribe the subscription using the good cb', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      const params = { channel: 'foo', id: 'id' };
      const cb = jest.fn();
      const cb2 = jest.fn();
      client.subscribe(params, cb);
      client.subscribe(params, cb2);
      expect(client.subscriptions.length).toBe(2);
      expect(client.subscriptions[0].params).toBe(params);
      expect(client.subscriptions[0].cb).toBe(cb);
      expect(client.subscriptions[1].params).toBe(params);
      expect(client.subscriptions[1].cb).toBe(cb2);

      client.unsubscribe('foo', cb);
      expect(client.subscriptions.length).toBe(1);

      expect(cb).toHaveBeenCalledTimes(0);
      expect(cb2).toHaveBeenCalledTimes(0);
      const obj = { client_reference: 'id', source: 'foo' };
      server.send(JSON.stringify(obj));

      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledTimes(0);
    });

    test('should unsubscribe all subscriptions related to a channel', () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      client.websocket.removeEventListener = jest.fn();
      client.websocket.addEventListener = jest.fn();
      const params = { channel: 'foo' };
      const params2 = { channel: 'bar' };
      const cb = jest.fn();
      const cb2 = jest.fn();
      client.subscribe(params, cb);
      client.subscribe(params, cb);
      client.subscribe(params, cb);
      client.subscribe(params, cb2);
      client.subscribe(params2, cb2);
      expect(client.subscriptions.length).toBe(3);
      expect(client.websocket.removeEventListener).toHaveBeenCalledTimes(2);
      expect(
        client.websocket.addEventListener.mock.calls.filter((c) => {
          return c[0] === 'message';
        }).length,
      ).toBe(5);

      client.unsubscribe('foo');
      expect(client.subscriptions.length).toBe(1);
      expect(client.subscriptions[0].params).toBe(params2);
      expect(client.subscriptions[0].cb).toBe(cb2);
    });

    test('send DEL when there is no more unquiet subscriptions on the channel', async () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      await server.connected;
      client.send = jest.fn();
      client.websocket.removeEventListener = jest.fn();
      client.websocket.addEventListener = jest.fn();
      const params = { channel: 'foo' };
      const cb = jest.fn();
      client.subscribe(params, cb);
      expect(client.send).toHaveBeenCalledWith('GET foo');
      expect(client.send).toHaveBeenCalledWith('SUB foo');

      client.unsubscribe('foo');
      expect(client.send).toHaveBeenCalledWith('DEL foo');
    });

    test("doesn't send DEL when we unsubscribe a quiet channel", () => {
      const client = new WebSocketAPI();
      client.connect(`ws://foo:1234`);
      client.send = jest.fn();
      client.websocket.removeEventListener = jest.fn();
      client.websocket.addEventListener = jest.fn();
      const params = { channel: 'foo' };
      const cb = jest.fn();
      client.subscribe(params, cb, null, true);
      expect(cb).toHaveBeenCalledTimes(0);

      client.unsubscribe('foo');
      expect(cb).toHaveBeenCalledTimes(0);
      client.send.mockRestore();
    });
  });
});
