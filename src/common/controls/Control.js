import Observable from 'ol/Observable';

/**
 * Generic control for mobility-toolbox-js.
 */
class Control extends Observable {
  /**
   * Constructor
   *
   * @param {Object} [options] Control options.
   * @param {boolean} [options.active = true] Whether the control is active.
   * @param {function} [options.renderCopyrights = (copyrights) => copyrights.join(' | ')] Callback function to render copyrights.
   */
  constructor(options = {}) {
    super(options);
    this.renderCopyrights = options.renderCopyrights
      ? options.renderCopyrights
      : (copyrights) => copyrights.join(' | ');

    /** @ignore */
    this.options = options;

    this.active = options.active;

    if (this.options.active) {
      this.active = true;
    }
  }
}

export default Control;
