import qs from 'query-string';

/**
 * Return the copyright a Mapbox map.
 * @param {mapboxgl.Map} map A Mapbox map
 * @ignore
 */
const getMapboxStyle = (apiKey, apiKeyName, styleUrl) => {
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

export default getMapboxStyle;
