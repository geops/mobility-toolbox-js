import BaseObject from 'ol/Object';

/**
 * A class representing a control to display on map.
 *
 * @example
 * const map = new Map();
 * const control = new Control();
 * map.addControl(control);
 *
 * @classproperty {ol/Map~Map|mapboxgl.Map} map - The map which the control refers to.
 * @classproperty {string} active - Active the control.
 * @classproperty {function} render - Render function called whenever the control needs to be rerendered.
 * @classproperty {HTMLElement} element - The HTML element used to render the control. Read only.
 * @classproperty {HTMLElement} target - The HTML element where to render the element property. Default is the map's element. Read only.
 */
class Control extends BaseObject {
  /**
   * Constructor
   *
   * @param {Object} [options] Control options.
   * @param {boolean} [options.active = true] Whether the control is active or not.
   * @param {HTMLElement} [options.element] The HTML element used to render the control.
   * @param {HTMLElement} [options.target] The HTML element where to render the element property. Default is the map's element.
   * @param {HTMLElement} [options.render] Render function called whenever the control needs to be rerendered.
   */
  constructor(options = {}) {
    super(options);
    this.defineProperties(options);

    const { active } = {
      active: true,
      ...options,
    };

    this.active = active;
  }

  /**
   * Define control's properties.
   *
   * @ignores
   */
  defineProperties(options) {
    const { target, element, render } = {
      ...options,
    };

    Object.defineProperties(this, {
      active: {
        get: () => {
          return this.get('active');
        },
        set: (newActive) => {
          this.set('active', newActive);
          if (newActive) {
            this.activate();
          } else {
            this.deactivate();
          }
          this.render();
        },
      },
      map: {
        get: () => {
          return this.get('map');
        },
        set: (map) => {
          // Remove previous node.
          if (this.map && this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
          }

          // Clean listeners
          this.deactivate();

          this.set('map', map);

          if (this.map) {
            // Add new node
            const targett = this.target || this.map.getContainer();
            if (this.element) {
              targett.appendChild(this.element);
            }

            // Add listeners
            if (this.active) {
              this.activate();
            }
          }
          this.render();
        },
      },
      target: {
        value: target,
      },
      element: {
        value: element,
      },
      render: {
        value: render || this.render,
        writable: true,
      },
    });
  }

  /**
   * Add listeners then renders the control.
   * To be defined in inherited classes.
   */
  activate() {
    this.deactivate();
  }

  /**
   * Remove listeners added by activate() function then renders the control.
   * To be defined in inherited classes.
   */
  // eslint-disable-next-line class-methods-use-this
  deactivate() {}

  /**
   * The default render function. It renders content in the HTML element.
   * To be defined in inherited classes.
   */
  render() {}
}

export default Control;
