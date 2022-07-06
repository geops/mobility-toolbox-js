import fetch from 'jest-fetch-mock';
import View from 'ol/View';
import Map from 'ol/Map';
import StopFinderControl from './StopFinderControl';

describe('StopFinderControl', () => {
  let map;

  beforeEach(() => {
    const target = document.createElement('div');
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

  test('should be activate by default', () => {
    const control = new StopFinderControl();
    expect(control.active).toBe(true);
  });

  test('launch a search and display results', (done) => {
    fetch.mockResponseOnce(JSON.stringify(global.stopsSearchResponse));

    const control = new StopFinderControl({
      url: 'https://foo.ch',
      apiKey: 'foo',
      apiParams: {
        limit: 10,
        foo: 'bar',
      },
    });
    control.attachToMap(map);
    expect(control.element).toBeDefined();
    control.search('foo').then(() => {
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
