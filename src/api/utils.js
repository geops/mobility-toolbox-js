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
  throw new Error(err);
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
    throw new Error(err);
  }
};

/**
 * Remove undefined values of an object.
 * @ignore
 */
export const cleanParams = (obj) => {
  const clone = { ...obj };
  Object.keys(obj).forEach(
    (key) =>
      (clone[key] === undefined || clone[key] === null) && delete clone[key],
  );
  return clone;
};

export default { handleError, readJsonResponse, cleanParams };
