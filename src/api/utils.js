/**
 * Display log message on error.
 * @private
 */
export const handleError = (reqType, err) => {
  if (err.name === 'AbortError') {
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(`Fetch ${reqType} request failed: `, err);
};

/**
 * Read json response.
 * @throws Error if parsing failed.
 * @private
 */
export const readJsonResponse = (response) => {
  try {
    return response.json();
  } catch (err) {
    throw new Error(err);
  }
};

export default { handleError, readJsonResponse };
