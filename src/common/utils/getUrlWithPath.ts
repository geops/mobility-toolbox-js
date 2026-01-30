/**
 * Concatenate an url with a path to avoid double slash.
 * @param {string} url a url.
 * @param {string} path a path.
 * @param {Object<String,String>} params a list of key/value pair to add to the url.
 * @private
 */
const getUrlWithPath = (url: string, path?: string): string => {
  const urlObj = new URL(url);
  let newUrl = url;
  let newPath = path;

  if (urlObj.searchParams.size > 0) {
    newUrl = url.split('?')[0];
  }

  if (!newUrl.endsWith('/')) {
    newUrl = `${newUrl}/`;
  }

  if (newPath?.startsWith('/')) {
    newPath = newPath.substring(1);
  }
  return newUrl + (newPath ?? '');
};

export default getUrlWithPath;
