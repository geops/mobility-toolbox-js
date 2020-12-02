import BaseObject from 'ol/Object';

/**
 * Generic control for mobility-toolbox-js.
 */
class Control extends BaseObject {
  /**
   * Constructor
   *
   * @param {Object} [options] Control options.
   * @param {boolean} [options.active = true] Whether the control is active.
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
   * @ignore
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
            targett.appendChild(this.element);

            // Add listeners
            if (this.active) {
              this.activate();
            }
          }
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

  activate() {
    this.deactivate();
    this.render();
  }

  deactivate() {
    this.render();
  }
}

export default Control;
