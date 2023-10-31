import fetch from 'jest-fetch-mock';
import API from './HttpAPI';

let api;

describe('HttpAPI', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    api = new API({ url: 'https://foo.ch', apiKey: 'apiKey' });
  });

  describe('#fetch', () => {
    test('should success', () => {
      fetch.mockResponseOnce(JSON.stringify({ foo: 'bar' }));

      api
        .fetch('/path', {
          q: 'Bern',
          fooUndefined: undefined,
          fooNull: null,
          fooEmpty: '',
        })
        .then((response) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://foo.ch/path?key=apiKey&q=Bern&fooEmpty=',
          );

          // Correct search result
          expect(response).toEqual({ foo: 'bar' });
        });
    });

    describe('should display error message', () => {
      test('reject error', (done) => {
        fetch.mockRejectOnce(new Error('Fake error message'));
        api.fetch().catch((err) => {
          expect(err.name).toEqual('Error');
          expect(err.message).toEqual('Fake error message');
          done();
        });
      });

      test('if the response is invalid json', (done) => {
        fetch.mockResponseOnce('invalid json');

        api.fetch().catch((err) => {
          expect(err.name).toEqual('FetchError');
          expect(err.message).toMatch(
            'invalid json response body at  reason: Unexpected token',
          );
          done();
        });
      });

      test('if the response contains an error message', (done) => {
        fetch.mockResponseOnce('{"error":"foo2"}');
        api.fetch().catch((err) => {
          expect(err.name).toEqual('Error');
          expect(err.message).toEqual('foo2');
          done();
        });
      });
    });
  });
});
