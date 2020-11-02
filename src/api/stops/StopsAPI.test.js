import fetch from 'jest-fetch-mock';
import StopsAPI from './StopsAPI';

let api;
let consoleOutput;

describe('StopsAPI', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    api = new StopsAPI({ apiKey: 'apiKey' });
  });

  describe('#search', () => {
    test('should success', () => {
      fetch.mockResponseOnce(JSON.stringify(global.stopsSearchResponse));

      return api
        .search({
          q: 'Bern',
        })
        .then((featureCollection) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://api.geops.io/stops/v1/?key=apiKey&q=Bern',
          );

          // Correct search result
          expect(featureCollection.features[0].properties.name).toEqual('Bern');
        });
    });

    test('returns empty FeatureCollection when params is null', () => {
      return api.search().then((featureCollection) => {
        // Correct search result
        expect(featureCollection.features.length).toEqual(0);
      });
    });

    test('returns empty FeatureCollection when params.q is null', () => {
      return api.search().then((featureCollection) => {
        // Correct search result
        expect(featureCollection.features.length).toEqual(0);
      });
    });

    describe('should should display error message error', () => {
      beforeEach(() => {
        // Mock console statement
        consoleOutput = [];
        // eslint-disable-next-line no-console
        console.warn = (message, err) =>
          consoleOutput.push([message, err.toString()]);
      });

      test('invalid json', () => {
        fetch.mockResponseOnce('invalid json');

        return api
          .search({
            q: 'Bern',
          })
          .catch(() => {
            expect(consoleOutput).toEqual([
              [
                'Fetch search request failed: ',
                'FetchError: invalid json response body at  reason: Unexpected token i in JSON at position 0',
              ],
            ]);
          });
      });

      test('reject error', () => {
        fetch.mockRejectOnce(new Error('Fake error message'));

        return api
          .search({
            q: 'Bern',
          })
          .catch(() => {
            expect(consoleOutput).toEqual([
              ['Fetch search request failed: ', 'Error: Fake error message'],
            ]);
          });
      });
    });
  });
});
