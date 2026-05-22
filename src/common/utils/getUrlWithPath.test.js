import getUrlWithPath from './getUrlWithPath';

describe('getUrlWithPath', () => {
  describe('should build the correct url', () => {
    test('without slash', () => {
      const url = getUrlWithPath('https://foo.ch', 'bar');
      expect(url.toString()).toEqual('https://foo.ch/bar');
    });

    test('with url slashed', () => {
      const url = getUrlWithPath('https://foo.ch/', 'bar');
      expect(url.toString()).toEqual('https://foo.ch/bar');
    });

    test('with path slashed', () => {
      const url = getUrlWithPath('https://foo.ch', '/bar');
      expect(url.toString()).toEqual('https://foo.ch/bar');
    });

    test('with both slashed', () => {
      const url = getUrlWithPath('https://foo.ch', '/bar');
      expect(url.toString()).toEqual('https://foo.ch/bar');
    });

    test('with parameter in url', () => {
      const url = getUrlWithPath('https://foo.ch?key=value', 'bar');
      expect(url.toString()).toEqual('https://foo.ch/bar');
    });

    test('without a path', () => {
      let url = getUrlWithPath('https://foo.ch', null);
      expect(url.toString()).toEqual('https://foo.ch/');
      url = getUrlWithPath('https://foo.ch', '');
      expect(url.toString()).toEqual('https://foo.ch/');
      url = getUrlWithPath('https://foo.ch', undefined);
      expect(url.toString()).toEqual('https://foo.ch/');
    });
  });
});
