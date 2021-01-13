import qs from 'query-string';

/**
 * Return the styleUrl with apiKey parameters set.
 * @param {string} apiKey apiKey value for the mapbox request.
 * @param {string} apiKeyName parameter name for apiKey in the mapbox request.
 * @param {string} styleUrl mapbox styleUrl value.
 * @ignore
 */
const getMapboxStyleUrl = (apiKey, apiKeyName, styleUrl) => {
  if (apiKey === false) {
    return styleUrl;
  }
  const parsedStyle = qs.parseUrl(styleUrl);
  if (!apiKey && parsedStyle.query[apiKeyName]) {
    return styleUrl;
  }
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.warn(`No apiKey is defined for request to ${styleUrl}`);
    return null;
  }
  return qs.stringifyUrl({
    ...parsedStyle,
    query: {
      ...parsedStyle.query,
      [apiKeyName]: apiKey,
    },
  });
};

export default getMapboxStyleUrl;
