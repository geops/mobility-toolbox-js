import { StopsAPI } from '../../api';

import type { StopsAPIOptions } from '../../api/StopsAPI';
import type { StopsParameters, StopsResponse } from '../../types';

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType[number];

export type StopFinderControlCommonOptions = {
  apiParams: StopsParameters;
  element: HTMLElement;
  onSuggestionClick?: (
    suggestion: ArrayElement<NonNullable<StopsResponse['features']>>,
    evt: MouseEvent,
  ) => void;
  placeholder?: string;
} & StopsAPIOptions;

/**
 * A class representing a stop finder control to display on map.
 * This class only draw the html elements.
 * The geographic logic must be implemented by subclasses.
 *
 * @private
 */
class StopFinderControlCommon {
  abortController?: AbortController;

  api: StopsAPI;

  apiParams: StopsParameters;

  clearElt?: HTMLDivElement;

  inputElt?: HTMLInputElement;

  options?: StopFinderControlCommonOptions;

  placeholder: string;

  suggestionsElt?: HTMLElement;

  /**
   * Constructor.
   *
   * @param {Object} options Options
   * @param {HTMLElement} options.element HTML element where to attach input and suggestions.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/). See StopsAPI.
   * @param {string} [options.url='https://api.geops.io/stops/v1/'] Stops service url. See StopsAPI.
   * @param {string} [options.placeholder='Search for a stop...'] Input field placeholder.
   * @param {StopsSearchParams} [options.apiParams={ limit: 20 }] Request parameters. See [Stops service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   */
  constructor(options: StopFinderControlCommonOptions) {
    const { apiKey, apiParams, placeholder, url } = options || {};

    this.apiParams = { limit: 20, ...(apiParams || {}) };
    this.placeholder = placeholder || 'Search for a stop...';

    const apiOptions: { apiKey?: string; url?: string } = { apiKey };
    if (url) {
      apiOptions.url = url;
    }
    this.api = new StopsAPI(apiOptions);
    this.abortController = new AbortController();
    this.createElement(options);
    this.options = options;
  }

  /**
   * Clear the search field and close the control.
   */
  clear() {
    if (!this.suggestionsElt || !this.inputElt || !this.clearElt) {
      return;
    }

    this.inputElt.value = '';
    this.suggestionsElt.innerHTML = '';
    this.clearElt.style.display = 'none';
  }

  createElement({ element }: StopFinderControlCommonOptions) {
    // Create input element
    this.inputElt = document.createElement('input');
    this.inputElt.type = 'text';
    this.inputElt.placeholder = this.placeholder;
    this.inputElt.autocomplete = 'off';
    this.inputElt.onkeyup = (evt) => {
      this.abortController?.abort();
      this.abortController = new AbortController();
      void this.search(
        (evt.target as HTMLInputElement).value,
        this.abortController,
      );
    };
    Object.assign(this.inputElt.style, {
      padding: '10px 30px 10px 10px',
    });
    element.appendChild(this.inputElt);

    // Create suggestions list element
    this.suggestionsElt = document.createElement('div');
    Object.assign(this.suggestionsElt.style, {
      backgroundColor: 'white',
      cursor: 'pointer',
      overflowY: 'auto',
    });
    element.appendChild(this.suggestionsElt);

    this.clearElt = document.createElement('div');
    Object.assign(this.clearElt.style, {
      cursor: 'pointer',
      display: 'none',
      fontSize: '200%',
      padding: '0 10px',
      position: 'absolute',
      right: '0',
    });
    this.clearElt.innerHTML = '×';
    this.clearElt.onclick = () => {
      return this.clear();
    };
    element.appendChild(this.clearElt);
  }

  render(featureCollection?: StopsResponse) {
    const suggestions = featureCollection?.features ?? [];
    if (!this.suggestionsElt) {
      return;
    }

    this.suggestionsElt.style.display = suggestions.length ? 'block' : 'none';
    this.suggestionsElt.innerHTML = '';

    suggestions.forEach((suggestion) => {
      const suggElt = document.createElement('div');
      suggElt.innerHTML = suggestion?.properties?.name || '';
      suggElt.onclick = (evt) => {
        this.options?.onSuggestionClick?.(suggestion, evt);
      };
      Object.assign(suggElt.style, {
        padding: '5px 12px',
      });
      this.suggestionsElt?.appendChild(suggElt);
    });
  }

  /**
   * Launch a search.
   *
   * @param {String} q The query to search for.
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @return {Promise<Array<GeoJSONFeature>>} An array of GeoJSON features with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  search(q: string, abortController: AbortController) {
    if (q !== undefined || q !== null) {
      this.apiParams.q = q;
    }

    if (this.clearElt) {
      this.clearElt.style.display = 'block';
    }

    return this.api
      .search(
        this.apiParams,
        abortController && { signal: abortController.signal },
      )
      .then((data) => {
        this.render(data);
      })
      .catch(() => {
        this.render();
      });
  }
}

export default StopFinderControlCommon;
