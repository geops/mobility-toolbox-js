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
   */
  constructor(options = {}) {
    super(options);

    /** @ignore */
    this.options = options;

    this.active = options.active;

    if (this.options.active) {
      this.active = true;
    }
  }
}

export default Control;
