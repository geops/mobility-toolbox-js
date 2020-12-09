/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import StopsAPI from '../../api/stops/StopsAPI';

/**
 * Search control interface.
 *
 * @classproperty {StopsSearchParams} apiParams - Default request parameters used by the search method. See [Stops service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
 */
export class SearchInterface {
  /**
   * Constructor.
   *
   * @param {Object} options Map options
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/). See StopsAPI.
   * @param {string} [options.url='https://api.geops.io/tracker/v1'] Stops service url. See StopsAPI.
   * @param {StopsSearchParams} [options.apiParams={ limit: 20 }] Request parameters. See [Stops service documentation](https://developer.geops.io/apis/5dcbd702a256d90001cf1361/).
   */
  // eslint-disable-next-line no-unused-vars
  constructor(options = {}) {}

  /**
   * Launch a search.
   *
   * @param {String} query The query to search for.
   * @param {AbortController} abortController Abort controller used to cancel the request.
   * @returns {Promise<GeoJSONFeature[]>} An array of GeoJSON features with coordinates in [EPSG:4326](http://epsg.io/4326).
   */
  // eslint-disable-next-line no-unused-vars
  search(query, abortController) {}
}

/**
 * Mixin for SearchInterface.
 *
 * @param {Class} Base  A class to extend with {SearchInterface} functionnalities.
 * @return {Class}  A class that implements <SearchInterface> class and extends Base;
 * @private
 */
const SearchMixin = (Base) =>
  class extends Base {
    constructor(options = {}) {
      super(options);

      this.apiParams = { limit: 20, ...(options.apiParams || {}) };

      this.api = new StopsAPI({
        url: options.url,
        apiKey: options.apiKey,
      });
    }

    render(suggestions = []) {
      if (!this.suggestionsElt) {
        return;
      }

      this.suggestionsElt.style.display = suggestions.length ? 'block' : 'none';

      this.suggestionsElt.innerHTML = '';

      suggestions.forEach((suggestion) => {
        const { properties } = suggestion;
        const suggElt = document.createElement('div');
        suggElt.innerHTML = properties.name;
        suggElt.onclick = () => {
          this.onSuggestionClick(suggestion);
        };
        this.suggestionsElt.appendChild(suggElt);
      });
    }

    createDefaultElement() {
      /**
       * Define a default element.
       */
      this.element = document.createElement('div');
      this.element.id = 'mbt-search';
      Object.assign(this.element.style, {
        position: 'absolute',
        top: 0,
        left: '50px',
        margin: '10px',
        display: 'flex',
        flexDirection: 'column',
      });

      // Create input element
      const inputElt = document.createElement('input');
      inputElt.type = 'text';
      inputElt.placeholder = 'Search for a stop...';
      inputElt.autoComplete = 'off';
      inputElt.onkeyup = (evt) => {
        this.search(evt.target.value);
      };
      Object.assign(inputElt.style, {
        padding: '10px',
      });
      this.element.appendChild(inputElt);

      // Create suggestions list element
      this.suggestionsElt = document.createElement('div');
      Object.assign(this.suggestionsElt.style, {
        backgroundColor: 'white',
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '10px',
      });
      this.element.appendChild(this.suggestionsElt);
    }

    search(q, abortController) {
      if (q !== undefined || q !== null) {
        this.apiParams.q = q;
      }
      return this.api
        .search(this.apiParams, abortController)
        .then((data) => {
          this.render(data);
        })
        .catch(() => {
          this.render();
        });
    }

    /**
     * To be defined in inherited class
     */
    // eslint-disable-next-line no-unused-vars
    onSuggestionClick(suggestion) {}
  };

export default SearchMixin;
