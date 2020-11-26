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
   * @param {function} [options.renderCopyrights = (copyrights) => copyrights.join(' | ')] Callback function to render copyrights.
   */
  constructor(map, options = {}) {
    super(map, options);
    this.map = map;
    this.renderCopyrights = options.renderCopyrights
      ? options.renderCopyrights
      : (copyrights) => copyrights.join(' | ');

    /** @ignore */
    this.options = {
      active: true,
      ...options,
    };

    this.active = options.active;

    if (this.options.active) {
      this.active = true;
    }
  }
}

export default Control;
