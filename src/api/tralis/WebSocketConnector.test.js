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
      // eslint-disable-next-line no-unused-vars
      const client = new Connector(`ws://foo:1234`);
      await server.connected;
      client.send('hello');
      await expect(server).toReceiveMessage('hello');
      expect(server).toHaveReceivedMessages(['hello']);
    });
  });
});
