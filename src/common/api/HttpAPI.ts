import BaseObject from 'ol/Object';

export type HttpApiOptions = {
  url: string;
  apiKey?: string;
};

/**
 * Common class to access to a geOps api.
 *
 * @example
 * import { API } from 'mobility-toolbox-js/api';
 *
 * const api = new HttpApi({
 *   url: [yourUrl],
 *   apiKey: [yourApiKey]
 * });
 *
 * @classproperty {string} url Url of the service.
 * @classproperty {string} apiKey Api key to access the service.
 */
class HttpApi extends BaseObject {
  url: string;
  apiKey: string;

  constructor(options: HttpApiOptions) {
    super();
    /** @ignore */
    this.url = options.url;

    /** @ignore */
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   * @ignore
   */
  fetch(path: string, params: Object, config: RequestInit): Promise<any> {
    // Clean requets parameters, removing undefined and null values.
    const urlParams = { ...(params || {}), key: this.apiKey };
    const clone = { ...urlParams };
    Object.keys(urlParams).forEach(
      (key) =>
        (clone[key] === undefined || clone[key] === null) && delete clone[key],
    );
    const url = new URL(this.url + path);
    Object.entries(clone).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    if (!this.apiKey) {
      // eslint-disable-next-line no-console
      return Promise.reject(
        new Error(`No apiKey defined for request to ${this.url}`),
      );
    }

    return fetch(url.toString(), config).then((response) => {
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
    });
  }
}

export default HttpApi;
