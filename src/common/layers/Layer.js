import BaseObject from 'ol/Object';
import { v4 as uuid } from 'uuid';

/**
 * A class representing a layer to display on map.
 *
 * @example
 * const layer = new Layer({
 *   name: 'My Layer',
 * });
 *
 * @classproperty {string} key - Identifier of the layer. Must be unique.
 * @classproperty {string} name - Name of the layer
 * @classproperty {string[]} copyrights - Array of copyrights.
 * @classproperty {Layer[]} children - List of children layers.
 * @classproperty {boolean} visible - Define if the layer is currently display on the map.
 * @classproperty {boolean} disabled - Define if the layer is currently display on the map but can't be seen (extent, zoom ,data restrictions).
 * @classproperty {number} hitTolerance - Hit-detection tolerance in css pixels. Pixels inside the radius around the given position will be checked for features.
 * @classproperty {Object} properties - Custom properties.
 * @classproperty {ol/Map~Map|mapboxgl.Map} map - The map where the layer is displayed.
 */
export default class Layer extends BaseObject {
  /**
   * Constructor
   *
   * @param {Object} options
   * @param {string} [options.key=uuid()] Identifier of the layer. Muste be unique. Default use a generated uuid.
   * @param {string} [options.name] Name of the layer.
   * @param {string[]} [options.copyrights] Array of copyrights.
   * @param {Array<Layer>} [options.children=[]] Sublayers, all child layers will have a parent property associated to this layer.
   * @param {boolean} [options.visible=true]  Define if the layer is currently display on the map.
   * @param {boolean} [options.disabled=false] Define if the layer is currently display on the map but can't be seen (extent, zoom ,data restrictions).
   * @param {number} [options.hitTolerance=5] Hit-detection tolerance in css pixels. Pixels inside the radius around the given position will be checked for features.
   * @param {Object} [options.properties={}] Application-specific layer properties.
   */
  constructor(options = {}) {
    super();
    this.defineProperties(options);

    this.setProperties(options.properties);

    this.visible = options.visible === undefined ? true : !!options.visible;

    this.group = options.group;

    this.copyrights = options.copyrights;

    this.children.forEach((child) => {
      // eslint-disable-next-line no-param-reassign
      child.parent = this;
    });

    // Listen for group visiblity change
    // if a layer from a group is newly visible we hide the others.
    this.on(`change:visible:group`, (evt) => {
      // We hide layer of the same group
      if (
        this.group === evt.target.group &&
        this !== evt.target &&
        this.visible
      ) {
        this.visible = false;
        // Propagate event to parent
      } else if (this.children) {
        this.children.forEach((child) => child.dispatchEvent(evt));
      }
    });
  }

  /**
   * Define layer's properties that needs custom get and set.
   *
   * @ignore
   */
  defineProperties(options) {
    const { name, key, children, properties, hitTolerance } = {
      ...options,
    };
    const uid = uuid();
    Object.defineProperties(this, {
      /* Layer's information properties */
      name: {
        value: name,
      },
      key: {
        value: key || uid,
      },
      group: {
        get: () => this.get('group'),
        set: (newGroup) => {
          this.set('group', newGroup);
        },
      },
      copyrights: {
        get: () => this.get('copyrights'),
        set: (newCopyrights) => {
          const arrValue =
            newCopyrights && !Array.isArray(newCopyrights)
              ? [newCopyrights]
              : newCopyrights;
          this.set('copyrights', arrValue || []);
        },
      },
      // options is used for clone function.
      options: {
        value: options,
      },
      map: {
        writable: true,
      },

      /* Layer's state properties */
      visible: {
        get: () => this.get('visible'),
        set: (newVisible) => {
          if (newVisible === this.visible) {
            return;
          }

          this.set('visible', newVisible);

          if (this.visible) {
            if (this.parent && !this.parent.visible) {
              this.parent.visible = true;
            }

            if (this.children && this.children.find((child) => child.group)) {
              const child = this.children.find((childd) => !!childd.group);
              // Make visible only radioGroup layers
              child.visible = true;
            }

            // Warn the same group that a new layer is visible
            if (this.parent && this.group) {
              // We search for the higher parent then it will dispatch to all the tree.
              let higherParent = this.parent;

              while (higherParent.parent) {
                higherParent = higherParent.parent;
              }
              higherParent.dispatchEvent({
                type: `change:visible:group`,
                target: this,
              });
            }
          } else if (!this.visible) {
            if (
              this.parent &&
              this.parent.visible &&
              !this.parent.children.find((child) => child.visible)
            ) {
              this.parent.visible = false;
            }
          }
        },
      },
      disabled: {
        get: () => this.get('disabled'),
        set: (newValue) => {
          this.set('disabled', newValue);
        },
      },

      /* Layer's hierarchy properties */
      parent: {
        value: null,
        writable: true,
      },
      children: {
        value: children || [],
        writable: true,
      },

      /* Layer's query properties */
      hitTolerance: {
        value: hitTolerance || 5,
        writable: true,
      },

      /* Custom app specific properties */
      properties: {
        value: { ...(properties || {}) },
      },
    });
  }

  /**
   * Initialize the layer with the map passed in parameters.
   *
   * @param {ol/Map~Map|mapboxgl.Map} map A map.
   */
  attachToMap(map) {
    this.detachFromMap();
    /** @ignore */
    this.map = map;

    if (this.children) {
      this.children.forEach((child) => {
        child.attachToMap(map);
      });
    }
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  // eslint-disable-next-line class-methods-use-this
  detachFromMap() {
    /** @ignore */
    this.map = null;
  }

  /**
   * Request feature information for a given coordinate.
   * This function must be implemented by inheriting layers.
   *
   * @param {ol/coordinate~Coordinate} coordinate Coordinate.
   * @param {Object} options Some options. See child classes to see which are supported.
   * @return {Promise<FeatureInfo>} An empty response.
   */
  // eslint-disable-next-line no-unused-vars
  getFeatureInfoAtCoordinate(coordinate, options) {
    // eslint-disable-next-line no-console
    console.error(
      'getFeatureInfoAtCoordinate must be implemented by inheriting layers',
      this.key,
    );

    // This layer returns no feature info.
    // The function is implemented by inheriting layers.
    return Promise.resolve({
      layer: this,
      features: [],
      coordinate,
    });
  }
}
