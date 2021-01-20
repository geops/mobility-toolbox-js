import fetch from 'jest-fetch-mock';
import API from './api';

let api;
let consoleOutput;

describe('API', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    api = new API({ url: 'https://foo.ch', apiKey: 'apiKey' });
  });

  describe('#fetch', () => {
    test('should success', () => {
      fetch.mockResponseOnce(JSON.stringify({ foo: 'bar' }));

      return api
        .fetch('/path', {
          q: 'Bern',
          fooUndefined: undefined,
          fooNull: null,
          fooEmpty: '',
        })
        .then((response) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://foo.ch/path?fooEmpty=&key=apiKey&q=Bern',
          );

          // Correct search result
          expect(response).toEqual({ foo: 'bar' });
        });
    });

    describe('should display error message', () => {
      beforeEach(() => {
        // Mock console statement
        consoleOutput = [];
        // eslint-disable-next-line no-console
        console.warn = (message, err) =>
          consoleOutput.push([message, err.toString()]);
      });

      test('reject error', (done) => {
        fetch.mockRejectOnce(new Error('Fake error message'));
        return api.fetch().catch(() => {
          expect(consoleOutput).toEqual([
            [
              'Fetch https://foo.ch request failed: ',
              'Error: Fake error message',
            ],
          ]);
          done();
        });
      });

      test('if the response is invalid json', (done) => {
        fetch.mockResponseOnce('invalid json');

        api.fetch().catch(() => {
          expect(consoleOutput).toEqual([
            [
              'Fetch https://foo.ch request failed: ',
              'FetchError: invalid json response body at  reason: Unexpected token i in JSON at position 0',
            ],
          ]);
          done();
        });
      });

      test('if the response contains an error message', (done) => {
        fetch.mockResponseOnce('{"error":"foo2"}');
        api.fetch().catch((err) => {
          expect(err.toString()).toBe('Error: foo2');
          expect(consoleOutput).toEqual([
            ['Fetch https://foo.ch request failed: ', 'Error: foo2'],
          ]);
          done();
        });
      });
    });
  });
});
