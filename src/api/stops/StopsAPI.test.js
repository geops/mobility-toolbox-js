import fetch from 'jest-fetch-mock';
import StopsAPI from './StopsAPI';

let api;

describe('StopsAPI', () => {
  beforeEach(() => {
    global.fetch = fetch;
    fetch.resetMocks();

    api = new StopsAPI({ apiKey: 'apiKey' });
  });

  test('search on success.', () => {
    fetch.mockResponseOnce(
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"uid": "7e7dbbe3be4bc3a6", "name": "Bern", "country_code": "CH", "rank": 0.125874125874126, "translated_names": [], "mot": {"bus": true, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8507000", "code": "BN", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.43912999999999,46.948832]}},{"type":"Feature","properties":{"uid": "0de283afdd72f1e9", "name": "Bern Wankdorf", "country_code": "CH", "rank": 0.232167831167475, "translated_names": [], "mot": {"bus": true, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8516161", "code": "BNWD", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.465477,46.967826]}},{"type":"Feature","properties":{"uid": "0b10797cae0d66ae", "name": "Bern B\u00fcmpliz S\u00fcd", "country_code": "CH", "rank": 0.24149183993573, "translated_names": [], "mot": {"bus": false, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8504106", "code": "BNBS", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.39523699999999,46.937487]}},{"type":"Feature","properties":{"uid": "5efc24456e966f44", "name": "Wabern bei Bern", "country_code": "CH", "rank": 0.260139854137714, "translated_names": [], "mot": {"bus": false, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8507078", "code": "WBB", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.445889,46.92866]}},{"type":"Feature","properties":{"uid": "28cf4f55b5c12c51", "name": "Bern Felsenau", "country_code": "CH", "rank": 0.273626372447381, "translated_names": [], "mot": {"bus": true, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8508051", "code": "BNFE", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.444249,46.9685]}},{"type":"Feature","properties":{"uid": "8a5be589a20396ee", "name": "Bern Tiefenau", "country_code": "CH", "rank": 0.273626372447381, "translated_names": [], "mot": {"bus": true, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8508052", "code": "BNTI", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.45019899999999,46.97274]}},{"type":"Feature","properties":{"uid": "3e6614fc41e84518", "name": "Ittigen bei Bern", "country_code": "CH", "rank": 0.27692307142111, "translated_names": [], "mot": {"bus": false, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8507069", "code": "ITT", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.48412900000001,46.97331]}},{"type":"Feature","properties":{"uid": "58b64d5b6dead060", "name": "Bern Europaplatz", "country_code": "CH", "rank": 0.282352935350858, "translated_names": [], "mot": {"bus": false, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8504108", "code": "BNAS", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.40611699999999,46.94421]}},{"type":"Feature","properties":{"uid": "aef478ea9a7cb78c", "name": "Bern  Europaplatz", "country_code": "CH", "rank": 0.282352935350858, "translated_names": [], "mot": {"bus": false, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8507082", "code": "BNAH", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.40746899999999,46.94344]}},{"type":"Feature","properties":{"uid": "0998c82223ecac24", "name": "Bern St\u00f6ckacker", "country_code": "CH", "rank": 0.282352935350858, "translated_names": [], "mot": {"bus": false, "ferry": false, "gondola": false, "tram": false, "rail": true, "funicular": false, "cable_car": false, "subway": false}, "ident_source": "sbb", "id": "8504495", "code": "BNST", "ifopt": null},"geometry":{"type":"Point","coordinates":[7.401179,46.94635]}}]}',
    );

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

  test('search on error.', () => {
    // Mock console statement
    const consoleOutput = [];
    // eslint-disable-next-line no-console
    console.warn = (message, err) =>
      consoleOutput.push([message, err.toString()]);

    fetch.mockResponseOnce('invalid json');

    return api
      .search({
        q: 'Bern',
      })
      .then(() => {
        expect(consoleOutput).toEqual([
          [
            'Fetch search request failed: ',
            'FetchError: invalid json response body at  reason: Unexpected token i in JSON at position 0',
          ],
        ]);
      });
  });
});
