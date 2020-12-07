import fetch from 'jest-fetch-mock';
import TrajservAPI from './TrajservAPI';

let api;

describe('TrajservAPI', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    api = new TrajservAPI({ apiKey: 'apiKey' });
  });

  describe('#fetchTrajectoryById', () => {
    test('should success', () => {
      fetch.mockResponseOnce(
        JSON.stringify(global.fetchTrajectoryByIdResponse),
      );

      return api
        .fetchTrajectoryById({
          a: '1',
          bbox:
            '917830.8141233932,5949421.787168904,926771.7516620635,5953300.375201735',
          btime: '5:54:7.880',
          cd: '1',
          date: '20200701',
          etime: '5:54:24.582',
          fl: '1',
          id: '16617:3',
          nm: '1',
          rid: '1',
          s: '0',
          time: '5:54:8.103',
          z: '15.248670953423606',
        })
        .then((response) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://api.geops.io/tracker/v1/trajectorybyid?a=1&bbox=917830.8141233932%2C5949421.787168904%2C926771.7516620635%2C5953300.375201735&btime=5%3A54%3A7.880&cd=1&date=20200701&etime=5%3A54%3A24.582&fl=1&id=16617%3A3&key=apiKey&nm=1&rid=1&s=0&time=5%3A54%3A8.103&z=15.248670953423606',
          );

          // Correct search result
          expect(response.rid).toEqual('21120.000011.101:1');
        });
    });

    test('should display error message', () => {
      // Mock console statement
      const consoleOutput = [];
      // eslint-disable-next-line no-console
      console.warn = (message, err) =>
        consoleOutput.push([message, err.toString()]);

      fetch.mockResponseOnce('invalid json');

      return api
        .fetchTrajectoryById({
          attr_det: '1',
          bbox:
            '922972.5439121567,5951167.694705085,923812.5648796591,5951532.096677226',
          btime: '5:18:31.766',
          etime: '5:18:41.967',
          date: '20200701',
          rid: '1',
          a: '1',
          cd: '1',
          nm: '1',
          fl: '1',
          s: '0',
          z: '18.66059982835272',
        })
        .catch(() => {
          expect(consoleOutput).toEqual([
            [
              'Fetch https://api.geops.io/tracker/v1/trajectorybyid request failed: ',
              'FetchError: invalid json response body at  reason: Unexpected token i in JSON at position 0',
            ],
          ]);
        });
    });
  });

  describe('#fetchTrajectories', () => {
    test('should success', () => {
      fetch.mockResponseOnce(JSON.stringify(global.fetchTrajectoriesResponse));

      return api
        .fetchTrajectories({
          attr_det: '1',
          bbox:
            '922972.5439121567,5951167.694705085,923812.5648796591,5951532.096677226',
          btime: '5:18:31.766',
          etime: '5:18:41.967',
          date: '20200701',
          rid: '1',
          a: '1',
          cd: '1',
          nm: '1',
          fl: '1',
          s: '0',
          z: '18.66059982835272',
        })
        .then((features) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://api.geops.io/tracker/v1/trajectory_collection?a=1&attr_det=1&bbox=922972.5439121567%2C5951167.694705085%2C923812.5648796591%2C5951532.096677226&btime=5%3A18%3A31.766&cd=1&date=20200701&etime=5%3A18%3A41.967&fl=1&key=apiKey&nm=1&rid=1&s=0&z=18.66059982835272',
          );

          // Correct search result
          expect(features[0].id).toEqual(4150092);
        });
    });

    test('should display error message if the transformation fails', () => {
      // Mock console statement
      const consoleOutput = [];
      // eslint-disable-next-line no-console
      console.warn = (message, err) =>
        consoleOutput.push([message, err.toString()]);

      fetch.mockResponseOnce(JSON.stringify({ foo: 'bar' }));

      return api
        .fetchTrajectories({
          attr_det: '1',
          bbox:
            '922972.5439121567,5951167.694705085,923812.5648796591,5951532.096677226',
          btime: '5:18:31.766',
          etime: '5:18:41.967',
          date: '20200701',
          rid: '1',
          a: '1',
          cd: '1',
          nm: '1',
          fl: '1',
          s: '0',
          z: '18.66059982835272',
        })
        .catch(() => {
          expect(consoleOutput).toEqual([
            [
              'Fetch trajectory_collection request failed: ',
              "TypeError: Cannot read property 'length' of undefined",
            ],
          ]);
        });
    });
  });

  describe('#fetchTrajectoryStations', () => {
    test('should success', () => {
      fetch.mockResponseOnce(
        JSON.stringify(global.fetchTrajectoryStationsResponse),
      );

      return api
        .fetchTrajectoryStations({
          a: '1',
          bbox:
            '1059098.4179109985,5917420.543096403,1063534.5137495932,5919344.9260996',
          btime: '6:17:22.722',
          cd: '1',
          date: '20200701',
          etime: '6:17:33.526',
          fl: '1',
          id: '1714251',
          key: 'apiKey',
          nm: '1',
          rid: '1',
          s: '0',
          time: '6:17:23.34',
          z: '16.259806538265146',
        })
        .then((response) => {
          // Correct url
          expect(fetch.mock.calls[0][0]).toEqual(
            'https://api.geops.io/tracker/v1/trajstations?a=1&bbox=1059098.4179109985%2C5917420.543096403%2C1063534.5137495932%2C5919344.9260996&btime=6%3A17%3A22.722&cd=1&date=20200701&etime=6%3A17%3A33.526&fl=1&id=1714251&key=apiKey&nm=1&rid=1&s=0&time=6%3A17%3A23.34&z=16.259806538265146',
          );

          // Correct search result
          expect(response.routeIdentifier).toEqual('01716.000072.001:1716');
        });
    });
  });
});
