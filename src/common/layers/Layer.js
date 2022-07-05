import BaseObject from 'ol/Object';
import { v4 as uuid } from 'uuid';

/**
 * A class representing a layer to display on map.
 *
 * @example
 * const layer = new Layer({
 *   name: 'myLayer',
 * });
 *
 * @classproperty {string} name - Name of the layer
 * @classproperty {string} key - Identifier of the layer. Must be unique.
 * @classproperty {string[]} copyrights - Array of copyrights.
 * @classproperty {boolean} isBaseLayer - Define if the layer is a base layer. Read-only.
 * @classproperty {boolean} isQueryable - Define if the layer can be queried. If false, it will set isHoverActive and isClickActive to false. Read-only.
 * @classproperty {boolean} isClickActive - If true feature information will be queried on user click event. See inherited layers for more informations. Read-only.
 * @classproperty {boolean} isHoverActive - If true feature information will be queried on pointer move event. See inherited layers for more informations. Read-only.
 * @classproperty {Layer[]} children - List of children.
 * @classproperty {boolean} visible - Define if the layer is visible or not.
 * @classproperty {number} hitTolerance - Hit-detection tolerance in css pixels. Pixels inside the radius around the given position will be checked for features.
 * @classproperty {Object} properties - Custom properties.
 * @classproperty {ol/Map~Map|mapboxgl.Map} map - The map where the layer is displayed.
 */
export default class Layer extends BaseObject {
  /**
   * Constructor
   *
   * @param {Object} options
   * @param {string} [options.name=uuid()] Layer name. Default use a generated uuid.
   * @param {string} [options.key=uuid().toLowerCase()] Layer key, will use options.name.toLowerCase() if not specified.
   * @param {string[]} [options.copyrights=undefined] Array of copyrights.
   * @param {Array<Layer>} [options.children=[]] Sublayers.
   * @param {Object} [options.properties={}] Application-specific layer properties.
   * @param {boolean} [options.visible=true] true if the layer is visible on the map.
   * @param {boolean} [options.disabled=true] true if the layer is disabled, that actually on the map but can't be seen  (extent, zoom ,data restrictions)
   * @param {boolean} [options.isBaseLayer=false] If true this layer is a baseLayer.
   * @param {boolean} [options.isQueryable=true] Define if the layer can be queried. If false, it will also set isHoverActive and isClickActive to false. Read-only.
   * @param {boolean} [options.isClickActive=true] If true feature information will be queried on click event. See inherited layers for more informations. Read-only.
   * @param {boolean} [options.isHoverActive=true] If true feature information will be queried on pointer move event. See inherited layers for more informations. Read-only.
   * @param {number} [options.hitTolerance=5] Hit-detection tolerance in css pixels. Pixels inside the radius around the given position will be checked for features.
   */
  constructor(options = {}) {
    super();
    this.defineProperties(options);

    // Add mouse event callbacks
    const { onClick, onHover } = options;

    if (onHover) {
      this.onHover(onHover);
    }

    if (onClick) {
      this.onClick(onClick);
    }

    if (options.properties) {
      this.setProperties(options.properties);
    }

    // This if is very important if you remove it you break the copyright control.
    if (options.copyrights) {
      /** @ignore */
      this.copyrights = options.copyrights;
    }

    this.visible = options.visible === undefined ? true : options.visible;

    if (this.children) {
      this.children.forEach((child) => {
        // eslint-disable-next-line no-param-reassign
        child.parent = this;
      });
    }

    this.group = options.group;

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

    /** @ignore */
    this.onUserClickCallback = this.onUserClickCallback.bind(this);

    /** @ignore */
    this.onUserMoveCallback = this.onUserMoveCallback.bind(this);
  }

  /**
   * Define layer's properties that needs custom get and set.
   *
   * @ignore
   */
  defineProperties(options) {
    const {
      name,
      key,
      children,
      properties,
      isBaseLayer,
      isQueryable,
      isClickActive,
      isHoverActive,
      hitTolerance,
    } = {
      isQueryable: true,
      isClickActive: true,
      isHoverActive: true,
      ...options,
    };
    const uid = uuid();
    const dfltName = name || uid;
    Object.defineProperties(this, {
      // options is used for clone function.
      options: {
        value: options,
      },
      name: {
        value: dfltName,
      },
      key: {
        value: key || dfltName.toLowerCase(),
      },
      isBaseLayer: {
        value: !!isBaseLayer,
      },
      isQueryable: {
        value: !!isQueryable,
        writable: true,
      },
      isClickActive: {
        value: !!isQueryable && !!isClickActive,
        writable: true,
      },
      isHoverActive: {
        value: !!isQueryable && !!isHoverActive,
        writable: true,
      },
      hitTolerance: {
        value: hitTolerance || 5,
        writable: true,
      },
      parent: {
        value: null,
        writable: true,
      },
      children: {
        value: children || [],
        writable: true,
      },
      copyrights: {
        get: () => this.get('copyrights'),
        set: (newCopyrights) => {
          const arrValue = !Array.isArray(newCopyrights)
            ? [newCopyrights]
            : newCopyrights;
          this.set('copyrights', arrValue);
        },
      },
      group: {
        get: () => this.get('group'),
        set: (newGroup) => {
          this.set('group', newGroup);
        },
      },
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
      properties: {
        value: { ...(properties || {}) },
      },
      map: {
        writable: true,
      },
      /**
       * Callback function when a user click on a feature.
       */
      clickCallbacks: {
        value: [],
      },
      /**
       * Callback function when a user hover on a feature.
       */
      hoverCallbacks: {
        value: [],
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
    // this.map = null;
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

    // No response so we modify the properties accordingly, to avoid spaming the console.
    this.isQueryable = false;
    // this.isClickActive = false;
    // this.isHoverActive = false;

    // This layer returns no feature info.
    // The function is implemented by inheriting layers.
    return Promise.resolve({
      layer: this,
      features: [],
      coordinate,
    });
  }

  /**
   * Listens to click events on the layer.
   * @param {function} callback Callback function, called with the clicked
   *   features,
   *   the layer instance and the click event.
   */
  onClick(callback) {
    if (typeof callback === 'function') {
      if (!this.clickCallbacks.includes(callback)) {
        this.clickCallbacks.push(callback);
      }
    } else {
      throw new Error('onClick callback must be of type function:', callback);
    }
  }

  /**
   * Unlistens to click events on the layer.
   * @param {function} callback Callback function, called with the clicked
   *   features,
   *   the layer instance and the click event.
   */
  unClick(callback) {
    if (typeof callback === 'function') {
      const idx = this.clickCallbacks.indexOf(callback);
      if (idx > -1) {
        this.clickCallbacks.splice(idx, 1);
      }
    }
  }

  /**
   * Function triggered when the user click the map.
   * @private
   */
  onUserClickCallback(evt) {
    const emptyFeatureInfo = {
      features: [],
      layer: this,
      coordinate: evt.coordinate,
      event: evt,
    };

    if (!this.isClickActive || !this.clickCallbacks.length) {
      return Promise.resolve(emptyFeatureInfo);
    }

    return this.getFeatureInfoAtCoordinate(evt.coordinate)
      .then((featureInfo) => {
        const { features, layer, coordinate } = featureInfo;
        this.clickCallbacks.forEach((callback) =>
          callback(features, layer, coordinate),
        );
        return featureInfo;
      })
      .catch(() => emptyFeatureInfo);
  }

  /**
   * Listens to hover events on the layer.
   * @param {function} callback Callback function, called with the clicked
   *   features, the layer instance and the click event.
   */
  onHover(callback) {
    if (typeof callback === 'function') {
      if (!this.hoverCallbacks.includes(callback)) {
        this.hoverCallbacks.push(callback);
      }
    } else {
      throw new Error('callback must be of type function.');
    }
  }

  /**
   * Unlistens to hover events on the layer.
   * @param {function} callback Callback function, called with the hovered
   *   features, the layer instance and the click event.
   */
  unHover(callback) {
    if (typeof callback === 'function') {
      const idx = this.hoverCallbacks.indexOf(callback);
      if (idx > -1) {
        this.hoverCallbacks.splice(idx, 1);
      }
    }
  }

  /**
   * Function triggered when the user move the cursor.
   * @private
   */
  onUserMoveCallback(evt) {
    const emptyFeatureInfo = {
      features: [],
      layer: this,
      coordinate: evt.coordinate,
      event: evt,
    };

    if (!this.isHoverActive || !this.hoverCallbacks.length) {
      return Promise.resolve(emptyFeatureInfo);
    }

    return this.getFeatureInfoAtCoordinate(evt.coordinate)
      .then((featureInfo) => {
        const { features, layer, coordinate } = featureInfo;
        this.hoverCallbacks.forEach((callback) =>
          callback(features, layer, coordinate),
        );
        return featureInfo;
      })
      .catch(() => emptyFeatureInfo);
  }
}
