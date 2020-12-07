/**
 * Display log message on error but not on AbortError.
 * @ignore
 */
export const handleError = (reqType, err) => {
  if (err.name === 'AbortError') {
    // Ignore AbortError.
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(`Fetch ${reqType} request failed: `, err);
  // Propagate the error.
  throw err;
};

/**
 * Read json response.
 * @throws Error if parsing failed.
 * @ignore
 */
export const readJsonResponse = (response) => {
  try {
    return response.json().then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    });
  } catch (err) {
    return Promise.reject(new Error(err));
  }
};

export default { handleError, readJsonResponse };
