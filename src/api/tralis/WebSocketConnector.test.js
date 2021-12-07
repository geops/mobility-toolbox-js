import WS from 'jest-websocket-mock';
import Connector from './WebSocketConnector';

describe('WebSocketConnector', () => {
  describe('#constructor', () => {
    let server;

    beforeEach(() => {
      server = new WS(`ws://foo:1234`);
    });

    afterEach(() => {
      server.close();
      WS.clean();
    });

    test('#constructor', async () => {
      const client = new Connector(`ws://foo:1234`);
      await server.connected;
      client.send('hello');
      await expect(server).toReceiveMessage('hello');
      expect(server).toHaveReceivedMessages(['hello']);
    });

    describe('#subscribe', () => {
      test('adds subscrption to subscriptions array', async () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
        await server.connected;
        const params = { channel: 'bar', args: ['baz'], id: 'id' };
        const cb = jest.fn();
        const errorCb = jest.fn();
        client.subscribe(params, cb, errorCb);
        expect(client.subscriptions.length).toBe(1);
        expect(client.subscriptions[0].params).toBe(params);
        expect(client.subscriptions[0].cb).toBe(cb);
        expect(client.subscriptions[0].errorCb).toBe(errorCb);
        expect(client.subscriptions[0].quiet).toBe(false);

        const obj = { source: 'bar baz', client_reference: 'id' };
        server.send(JSON.stringify(obj));

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(obj);
      });

      test("doesn't duplicate subscriptions", async () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
        await server.connected;
        const params = { channel: 'bar', args: ['baz'], id: 'id' };
        const cb = jest.fn();
        const errorCb = jest.fn();
        client.subscribe(params, cb, errorCb, true);
        client.subscribe(params, cb, errorCb, true);
        expect(client.subscriptions.length).toBe(1);

        const obj = { source: 'bar baz', client_reference: 'id' };
        server.send(JSON.stringify(obj));

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(obj);
      });

      test('send GET and SUB requests.', async () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
        client.send = jest.fn();
        const params = { channel: 'bar', args: ['baz'], id: 'id' };
        const cb = jest.fn();
        const errorCb = jest.fn();
        client.subscribe(params, cb, errorCb);
        expect(client.send).toHaveBeenCalledTimes(2);
        expect(client.send).toHaveBeenCalledWith('GET bar baz id');
        expect(client.send).toHaveBeenCalledWith('SUB bar baz id');
        client.send.mockRestore();
      });

      test('should register callback without sending GET and SUB requests (quiet=true).', async () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
        await server.connected;
        const params = { channel: 'bar', args: ['baz'], id: 'id' };
        const cb = jest.fn();
        const errorCb = jest.fn();
        client.send = jest.fn();
        client.subscribe(params, cb, errorCb, true);
        expect(client.subscriptions.length).toBe(1);
        expect(client.subscriptions[0].params).toBe(params);
        expect(client.subscriptions[0].cb).toBe(cb);
        expect(client.subscriptions[0].errorCb).toBe(errorCb);
        expect(client.subscriptions[0].quiet).toBe(true);
        expect(client.send).toBeCalledTimes(0);
        client.send.mockRestore();
      });
    });

    describe('#unsubscribe', () => {
      test('should only unsubscribe the subscription using the good cb', async () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
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

        const obj = { source: 'foo', client_reference: 'id' };
        server.send(JSON.stringify(obj));

        expect(cb).toHaveBeenCalledTimes(0);
        expect(cb2).toHaveBeenCalledTimes(1);
      });

      test('should unsubscribe all subscriptions related to a channel', () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
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
        expect(client.websocket.removeEventListener).toBeCalledTimes(2);
        expect(client.websocket.addEventListener).toBeCalledTimes(9);

        client.unsubscribe('foo');
        expect(client.subscriptions.length).toBe(1);
        expect(client.subscriptions[0].params).toBe(params2);
        expect(client.subscriptions[0].cb).toBe(cb2);
      });

      test('send DEL when there is no more unquiet subscriptions on the channel', () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
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
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
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
});
