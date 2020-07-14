/**
 * Display log message on error but not on AbortError.
 * @ignore
 */
export const handleError = (reqType, err) => {
  if (err && err.name !== 'AbortError') {
    // eslint-disable-next-line no-console
    console.warn(`Fetch ${reqType} request failed: `, err);
  }
  throw new Error(err);
};

/**
 * Read json response.
 * @throws Error if parsing failed.
 * @ignore
 */
export const readJsonResponse = (response) => {
  try {
    return response.json();
  } catch (err) {
    throw new Error(err);
  }
};

export default { handleError, readJsonResponse };
