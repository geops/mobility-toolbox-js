import fetch from 'jest-fetch-mock';
import StopsAPI from './StopsAPI';

let api;

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
        .then((features) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://api.geops.io/stops/v1/?key=apiKey&q=Bern',
          );

          // Correct search result
          expect(features[0].properties.name).toEqual('Bern');
        });
    });
  });
});
