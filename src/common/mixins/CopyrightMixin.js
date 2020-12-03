/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

/**
 * CopyrightInterface.
 *
 */
export class CopyrightInterface {
  /**
   * Return an array of mobility layer's copyright.
   *
   * @returns {String[]} A list of vehicles.
   */
  getCopyrights() {}
}

/**
 * Mixin for CopyrightInterface.
 *
 * @param {Class} Base  A class to extend with {CopyrightInterface} functionnalities.
 * @return {Class}  A class that implements <CopyrightInterface> class and extends Base;
 * @private
 */
const CopyrightMixin = (Base) =>
  class extends Base {
    constructor(options) {
      const opts = { ...options };
      if (!opts.element) {
        /**
         * Define a default element.
         */
        opts.element = document.createElement('div');
        opts.element.id = 'mb-copyright';
        Object.assign(opts.element.style, {
          position: 'absolute',
          bottom: 0,
          right: 0,
          fontSize: '.8rem',
          padding: '0 10px',
        });
      }
      super(opts);
    }

    render() {
      this.element.innerHTML = this.active
        ? this.getCopyrights().join(' | ')
        : '';
    }
  };

export default CopyrightMixin;