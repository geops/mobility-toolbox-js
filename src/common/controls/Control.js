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
   * @param {HTMLElement} [options.targetElement = map.getTargetElement()] Container element where to locate the copyright.
   */
  constructor(map, options = {}) {
    super();
    this.map = map;
    this.targetElement = options.targetElement || this.map.getTargetElement();

    /** @ignore */
    this.options = {
      active: true,
      ...options,
    };

    this.active = options.active;

    if (this.options.active) {
      this.activate();
    }
  }

  /**
   * Activate the control.
   */
  activate() {
    this.active = true;
  }

  /**
   * Deactivate the control.
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Get te control's active state.
   * @returns {boolean} Active state.
   */
  getActive() {
    return this.active;
  }
}

export default Control;
