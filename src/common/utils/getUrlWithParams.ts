/**
 * Return the styleUrl with apiKey parameters set.
 * @param {string} url a url.
 * @param {Object<String,String>} params a list of key/value pair to add to the url.
 * @private
 */
const getUrlWithParams = (url: string, params: object): URL => {
  // Clean requets parameters, removing undefined and null values.
  const newUrl = new URL(url);

  const searchParams = params || {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      newUrl.searchParams.set(key, value);
    }
  });

  return newUrl;
};

export default getUrlWithParams;
