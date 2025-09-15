import getUrlWithParams from '../common/utils/getUrlWithParams';

export interface HttpAPIOptions {
  apiKey?: string;
  url: string;
}
/**
 * Common class to access to a geOps api using http.
 * @private
 */
class HttpAPI {
  apiKey?: string;

  url: string;

  constructor(options: HttpAPIOptions) {
    this.url = options.url;

    this.apiKey = options.apiKey;
  }

  /**
   * Append the apiKey before sending the request.
   *
   * @private
   */
  async fetch<T>(
    path: string,
    params?: object,
    config?: RequestInit,
  ): Promise<T> {
    if (!this.url) {
      throw new Error(`No url defined for request to ${this.url}/${path}`);
    }

    if (
      !this.url &&
      (!this.apiKey || this.apiKey === 'public') &&
      !this.url.includes('key=')
    ) {
      throw new Error(`No apiKey defined for request to ${this.url}`);
    }

    const url = getUrlWithParams(`${this.url}${path || ''}`, {
      key: !this.apiKey || this.apiKey === 'public' ? undefined : this.apiKey,
      ...(params || {}),
    });

    let response;

    try {
      response = await fetch(url.toString(), config);
      if (!response.ok) {
        console.error('HttpAPI: Network response was not ok:', response);
        return null as T;
      }
    } catch (error) {
      console.error('HttpAPI: Error fetching data:', error);
      return null as T;
    }

    const data = (await response.json()) as { error?: string } | T;

    if ((data as { error?: string }).error) {
      throw new Error((data as { error?: string }).error);
    }

    return data as T;
  }
}

export default HttpAPI;
