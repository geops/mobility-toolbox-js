/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

/**
 * Copyright control interface.
 *
 */
export class CopyrightInterface {
  /**
   * Return an array of layer's copyright.
   *
   * @returns {String[]} A list of copyrights to render.
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
    render() {
      if (!this.element) {
        return;
      }
      this.element.innerHTML = this.active
        ? this.getCopyrights().join(' | ')
        : '';
    }

    createDefaultElement() {
      this.element = document.createElement('div');
      this.element.id = 'mb-copyright';
      Object.assign(this.element.style, {
        position: 'absolute',
        bottom: 0,
        right: 0,
        fontSize: '.8rem',
        padding: '0 10px',
      });
    }
  };

export default CopyrightMixin;
