import type { Map as OlMap } from 'ol';
import BaseObject from 'ol/Object';
import type { AnyMap, AnyMapboxMap } from '../../types';

export type ControlCommonOptions = {
  active?: Boolean;
  element?: HTMLElement;
  target?: HTMLElement;
  render?: () => void;
};

/**
 * A class representing a control to display on map.
 *
 * @example
 * const control = new Control();
 *
 * @classproperty {ol/Map~Map|mapboxgl.Map} map - The map which the control refers to.
 * @classproperty {boolean} active - Active the control.
 * @classproperty {HTMLElement} element - The HTML element used to render the control.
 * @classproperty {HTMLElement} target - The HTML element where to render the element property. Default is the map's element. Read only.
 */
class ControlCommon extends BaseObject {
  active: Boolean;

  map?: AnyMap;

  target?: HTMLElement;

  element?: HTMLElement;

  /**
   * Constructor
   *
   * @param {Object} [options] Control options.
   * @param {boolean} [options.active = true] Whether the control is active or not.
   * @param {HTMLElement} [options.element] The HTML element used to render the control.
   * @param {HTMLElement} [options.target] The HTML element where to render the element property. Default is the map's element.
   * @param {function} [options.render] Render function called whenever the control needs to be rerendered.
   */
  constructor(options: ControlCommonOptions = {}) {
    super(options);
    this.defineProperties(options);

    const { active } = {
      active: options.active !== false,
      ...options,
    };

    /**
     * @private
     */
    this.active = active;
  }

  /**
   * Define control's properties.
   *
   * @private
   * @private
   */
  defineProperties(options: ControlCommonOptions) {
    const { target, element, render } = {
      ...options,
    };

    Object.defineProperties(this, {
      active: {
        get: () => this.get('active'),
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
        get: () => this.get('map'),
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
            const targett =
              this.target ||
              ((this.map as OlMap).getTargetElement &&
                (this.map as OlMap).getTargetElement()) ||
              ((this.map as AnyMapboxMap).getContainer &&
                (this.map as AnyMapboxMap).getContainer());

            if (!this.element) {
              this.createDefaultElement();
            }

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
        writable: true,
      },
      render: {
        /** @private */
        value: render || this.render,
        writable: true,
      },
    });
  }

  /**
   * Attach the control to the map. Add events, html element ...
   */
  attachToMap(map: AnyMap) {
    this.map = map;
  }

  /**
   * Detach the control From the map. Remove events, html element ..
   */
  detachFromMap() {
    this.map = undefined;
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
  deactivate() {
    // eslint-disable-next-line no-console
    console.error(
      'The function deactivate() must be implemented in subclasses',
    );
  }

  /**
   * The default render function. It renders content in the HTML element.
   * To be defined in inherited classes.
   *
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(options?: any) {
    // eslint-disable-next-line no-console
    console.error('The function render() must be implemented in subclasses');
  }

  /**
   * The default element to display if this.element is not defined.
   * To be defined in inherited classes.
   *
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  createDefaultElement() {
    // eslint-disable-next-line no-console
    console.error(
      'The function createDefaultElement() must be implemented in subclasses',
    );
  }
}

export default ControlCommon;
