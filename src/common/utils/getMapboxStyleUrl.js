/**
 * Return the styleUrl with apiKey parameters set.
 * @param {string} apiKey apiKey value for the mapbox request.
 * @param {string} apiKeyName parameter name for apiKey in the mapbox request.
 * @param {string} styleUrl mapbox styleUrl value.
 * @ignore
 */
const getMapboxStyleUrl = (apiKey, apiKeyName, styleUrl) => {
  const url = new URL(styleUrl);
  if (!apiKey && !url.searchParams.get(apiKeyName)) {
    // eslint-disable-next-line no-console
    console.warn(`No apiKey is defined for request to ${styleUrl}`);
    return null;
  }
  if (apiKeyName && apiKey) {
    url.searchParams.set(apiKeyName, apiKey);
  }
  return url.toString();
};

export default getMapboxStyleUrl;
