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
    this.defineProperties({ active: true, ...options });
  }

  /**
   * Define control's properties.
   *
   * @ignore
   */
  defineProperties(opts) {
    let { active } = opts;
    Object.defineProperties(this, {
      active: {
        get: () => {
          return active;
        },
        set: (newActiveVal) => {
          active = newActiveVal;
        },
        configurable: true,
      },
      options: {
        value: opts || {},
        writable: true,
      },
      map: {
        value: opts.map,
        writable: true,
      },
    });
  }
}

export default Control;
