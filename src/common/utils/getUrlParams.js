/**
 * Return the url parameters.
 * @param {string} url a url string
 * @ignore
 */
const getUrlParams = (url = '') => {
  const hashes = url.slice(url.indexOf('?') + 1).split('&');
  const params = {};
  hashes.forEach((hash) => {
    const [key, val] = hash.split('=');
    if (val) {
      params[key] = decodeURIComponent(val);
    }
  });
  return params;
};

export default getUrlParams;
