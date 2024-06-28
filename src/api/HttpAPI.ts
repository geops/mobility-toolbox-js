import getUrlWithParams from '../common/utils/getUrlWithParams';

export type HttpAPIOptions = {
  url: string;
  apiKey?: string;
};
/**
 * Common class to access to a geOps api using http.
 * @private
 */
class HttpAPI {
  url: string;

  apiKey?: string;

  constructor(options: HttpAPIOptions) {
    /** @private */
    this.url = options.url;

    /** @private */
    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   *
   * @private
   */
  async fetch(path: string, params: Object, config: RequestInit): Promise<any> {
    if (!this.url) {
      throw new Error(`No url defined for request to ${this.url}/${path}`);
    }

    if (!this.url && !this.apiKey && !/key=/.test(this.url)) {
      // eslint-disable-next-line no-console
      throw new Error(`No apiKey defined for request to ${this.url}`);
    }

    // Clean requets parameters, removing undefined and null values.
    const searchParams = params || {};
    const url = getUrlWithParams(`${this.url}${path || ''}`, {
      key: this.apiKey,
      ...searchParams,
    });
    const response = await fetch(url.toString(), config);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }
}

export default HttpAPI;
