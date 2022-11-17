import fetch from 'jest-fetch-mock';
import RoutingAPI from './RoutingAPI';

let api;

describe('RoutingAPI', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    api = new RoutingAPI({ apiKey: 'apiKey' });
  });

  describe('#route', () => {
    test('should success', (done) => {
      fetch.mockResponseOnce(JSON.stringify(global.fetchRouteResponse));

      api
        .route({
          mot: 'bus',
          via: '47.3739194713294,8.538274823394632|47.37595378493421,8.537490375951839',
        })
        .then((featureCollection) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://api.geops.io/routing/v1/?key=apiKey&mot=bus&via=47.3739194713294%2C8.538274823394632%7C47.37595378493421%2C8.537490375951839',
          );

          // Correct search result (for bus mot)
          expect(featureCollection.features[0].geometry.type).toEqual(
            'LineString',
          );
          expect(featureCollection.features[0].properties.lines).toBeDefined();
          expect(
            featureCollection.features[0].properties.station_to,
          ).toBeDefined();
          done();
        });
    });
  });
});
