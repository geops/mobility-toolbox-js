/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import StopsAPI from '../../api/stops/StopsAPI';

/**
 * Search control interface.
 *
 */
export class SearchInterface {
  /**
   * launch a stations search.
   *
   * @returns {String} query The query to search for.
   */
  // eslint-disable-next-line no-unused-vars
  search(query) {}
}

/**
 * Mixin for SearchInterface.
 *
 * @param {Class} Base  A class to extend with {CopyrightInterface} functionnalities.
 * @return {Class}  A class that implements <CopyrightInterface> class and extends Base;
 * @private
 */
const SearchMixin = (Base) =>
  class extends Base {
    constructor(options) {
      const opts = { ...options };
      let inputElt;
      let suggestionsElt;
      let filterElt;
      const checkboxes = [];

      if (!opts.element) {
        /**
         * Define a default element.
         */
        opts.element = document.createElement('div');
        opts.element.id = 'mbt-search';
        Object.assign(opts.element.style, {
          position: 'absolute',
          top: 0,
          fontSize: '.8rem',
          padding: '0 10px',
          width: '300px',
        });

        filterElt = document.createElement('div');
        suggestionsElt = document.createElement('div');
        inputElt = document.createElement('input');
        inputElt.type = 'text';
        inputElt.placeholder = 'Search for a stop...';
        inputElt.autoComplete = 'off';
        inputElt.onkeyup = opts.element.appendChild(inputElt);
        opts.element.appendChild(filterElt);
        opts.element.appendChild(suggestionsElt);
        const mots = [
          'bus',
          'ferry',
          'gondola',
          'tram',
          'rail',
          'funicular',
          'cable_car',
          'subway',
        ];
        mots.forEach((mot) => {
          const label = document.createElement('label');
          const checkbox1 = document.createElement('input');
          checkbox1.type = 'checkbox';
          checkbox1.value = mot;
          const span = document.createElement('span');
          span.innerHTML = mot;
          checkboxes.push(checkbox1);
          label.appendChild(checkbox1);
          label.appendChild(span);
          filterElt.appendChild(label);
        });
      }

      super(opts);

      this.apiParams = { limit: 20, ...(options.apiParams || {}) };
      this.api = new StopsAPI({
        params: this.apiParams,
        apiKey: options.apiKey,
      });

      if (inputElt) {
        inputElt.onkeyup = (evt) => {
          this.search(evt.target.value);
        };
      }

      if (suggestionsElt) {
        this.suggestionsElt = suggestionsElt;
      }
      if (checkboxes.length) {
        checkboxes.forEach((checkbox) => {
          // eslint-disable-next-line no-param-reassign
          checkbox.onchange = (evt) => {
            this.onFilterChange(evt);
          };
        });
      }
    }

    render(suggestions = []) {
      if (!this.suggestionsElt) {
        return;
      }
      this.suggestionsElt.innerHTML = '';

      suggestions.forEach((suggestion) => {
        const { properties } = suggestion;
        const a = document.createElement('a');
        a.innerText = `${properties.name} → `;
        a.onclick = () => {
          this.onSuggestionClick(suggestion);
        };
        this.suggestionsElt.appendChild(a);
      });
    }

    search(q) {
      if (q) {
        this.apiParams.q = q;
      }
      this.api
        .search(this.apiParams)
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

    /**
     * To be defined in inherited class
     */
    // eslint-disable-next-line no-unused-vars
    onFilterChange(evt) {
      const mot = evt.target.value;
      const mots =
        (this.apiParams.mots && this.apiParams.mots.split(',')) || [];
      console.log(evt.target, mot, mots);
      if (evt.target.checked && !mots.includes(mot)) {
        mots.push(mot);
      } else if (!evt.target.checked && mots.includes(mot)) {
        const index = mots.indexOf(mot);
        mots.splice(index, 1);
      }
      this.apiParams.mots = mots.toString();
      this.search();
    }
  };

export default SearchMixin;
