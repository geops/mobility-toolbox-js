/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Feature, FeatureCollection } from 'geojson';
import { StopsAPI } from '../../api';
import { StopsAPIOptions } from '../../api/StopsAPI';
import { StopsParameters } from '../../types';

export type StopFinderControlCommonOptions = StopsAPIOptions & {
  element: HTMLElement;
  placeholder?: string;
  apiParams: StopsParameters;
  onSuggestionClick?: (suggestion: Feature, evt: MouseEvent) => void;
};

/**
 * A class representing a stop finder control to display on map.
 * This class only draw the html elements.
 * The geographic logic must be implemented by subclasses.
 *
 * @ignore
 */
class StopFinderControlCommon {
  apiParams: StopsParameters;

  placeholder: string;

  api: StopsAPI;

  abortController?: AbortController;

  suggestionsElt?: HTMLElement;

  inputElt?: HTMLInputElement;

  clearElt?: HTMLDivElement;

  options?: StopFinderControlCommonOptions;

  /**
   * Constructor.
   *
   * @param {Object} options Options
   * @param {HTMLElement} options.element HTML element where to attach input and suggestions.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/). See StopsAPI.
   * @param {string} [options.url='https://api.geops.io/tracker/v1'] Stops service url. See StopsAPI.
   * @param {string} [options.placeholder='Search for a stop...'] Input field placeholder.
   * @param {StopsSearchParams} [options.apiParams={ limit: 20 }] Request parameters. See [Stops service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   */
  constructor(options: StopFinderControlCommonOptions) {
    const { apiParams, apiKey, url, placeholder } = options || {};

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

  render(featureCollection?: FeatureCollection) {
    const suggestions = featureCollection?.features || [];
    if (!this.suggestionsElt) {
      return;
    }

    this.suggestionsElt.style.display = suggestions.length ? 'block' : 'none';
    this.suggestionsElt.innerHTML = '';

    suggestions.forEach((suggestion) => {
      const suggElt = document.createElement('div');
      suggElt.innerHTML = suggestion?.properties?.name;
      suggElt.onclick = (evt) => {
        this.options?.onSuggestionClick?.(suggestion, evt);
      };
      Object.assign(suggElt.style, {
        padding: '5px 12px',
      });
      this.suggestionsElt?.appendChild(suggElt);
    });
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
      // @ts-ignore
      this.search(evt.target.value, this.abortController);
    };
    Object.assign(this.inputElt.style, {
      padding: '10px 30px 10px 10px',
    });
    element.appendChild(this.inputElt);

    // Create suggestions list element
    this.suggestionsElt = document.createElement('div');
    Object.assign(this.suggestionsElt.style, {
      backgroundColor: 'white',
      overflowY: 'auto',
      cursor: 'pointer',
    });
    element.appendChild(this.suggestionsElt);

    this.clearElt = document.createElement('div');
    Object.assign(this.clearElt.style, {
      display: 'none',
      position: 'absolute',
      right: '0',
      padding: '0 10px',
      fontSize: '200%',
      cursor: 'pointer',
    });
    this.clearElt.innerHTML = '×';
    this.clearElt.onclick = () => this.clear();
    element.appendChild(this.clearElt);
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

  /**
   * Launch a search.
   *
   * @param {String} query The query to search for.
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
        this.render(data as FeatureCollection);
      })
      .catch(() => {
        this.render();
      });
  }
}

export default StopFinderControlCommon;
