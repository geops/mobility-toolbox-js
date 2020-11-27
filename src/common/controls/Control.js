import Observable from 'ol/Observable';

/**
 * Generic control for mobility-toolbox-js.
 */
class Control extends Observable {
  /**
   * Constructor
   *
   * @param {ol/Map~Map|mapboxgl.Map} map Control's map.
   * @param {Object} [options] Control options.
   * @param {boolean} [options.active = true] Whether the control is active.
   */
  constructor(map, options = {}) {
    super(map, options);
    this.defineProperties({ active: true, map, ...options });
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
        value: opts.options || {},
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
