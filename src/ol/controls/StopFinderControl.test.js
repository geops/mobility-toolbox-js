import fetch from 'jest-fetch-mock';
import Map from 'ol/Map';
import View from 'ol/View';

import StopFinderControl from './StopFinderControl';

describe('StopFinderControl', () => {
  let map;

  beforeEach(() => {
    const target = document.createElement('canvas');
    document.body.appendChild(target);
    map = new Map({
      target,
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
    global.fetch = fetch;
  });

  afterEach(() => {
    if (map) {
      map.setTarget(null);
      map = null;
    }
    fetch.resetMocks();
  });

  test('launch a search and display results', (done) => {
    fetch.mockResponseOnce(JSON.stringify(global.stopsSearchResponse));

    const control = new StopFinderControl({
      apiKey: 'foo',
      apiParams: {
        foo: 'bar',
        limit: 10,
      },
      url: 'https://foo.ch',
    });
    map.addControl(control);
    expect(control.element).toBeDefined();
    void control.search('foo').then(() => {
      // Correct url
      expect(fetch.mock.calls[0][0]).toEqual(
        'https://foo.ch/?key=foo&limit=10&foo=bar&q=foo',
      );
      expect(
        control.element.querySelector('div').querySelector('div').innerHTML,
      ).toBe('Bern');
      done();
    });
  });
});
