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

    test('#subscribe', async () => {
      // eslint-disable-next-line no-unused-vars
      const client = new Connector(`ws://foo:1234`);
      const params = {};
      const cb = jest.fn();
      client.subscribe(params, cb);
      expect(client.subscriptions.length).toBe(1);
      expect(client.subscriptions[0].params).toBe(params);
      expect(client.subscriptions[0].cb).toBe(cb);
    });

    describe('#unsubscribe', () => {
      test('should only unsubscribe the subscription using the good cb', () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
        const params = { channel: 'foo' };
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
    });

    describe('#setBbox', () => {
      test.only('should remove subscriptions before re adding it ', () => {
        // eslint-disable-next-line no-unused-vars
        const client = new Connector(`ws://foo:1234`);
        client.websocket.removeEventListener = jest.fn();
        client.websocket.addEventListener = jest.fn();
        client.send = jest.fn();
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
        expect(client.websocket.addEventListener).toBeCalledTimes(5);

        client.websocket.removeEventListener.mockReset();
        client.websocket.addEventListener.mockReset();

        client.setBbox([0, 0, 0, 0]);

        expect(client.subscriptions.length).toBe(3);
        expect(client.websocket.removeEventListener).toBeCalledTimes(0);
        expect(client.websocket.addEventListener).toBeCalledTimes(0);

        client.unsubscribe('foo');
        expect(client.subscriptions.length).toBe(1);
        expect(client.subscriptions[0].params).toBe(params2);
        expect(client.subscriptions[0].cb).toBe(cb2);
        client.unsubscribe('bar');
        expect(client.subscriptions.length).toBe(0);
        client.send.mockRestore();
        client.websocket.removeEventListener.mockRestore();
        client.websocket.addEventListener.mockRestore();
      });
    });
  });
});
