import Observable from 'ol/Observable';
import { v4 as uuid } from 'uuid';

/**
 * A class representing a layer to display on map.
 *
 * @example
 *
 * const layer = new Layer({
 *   name: 'myLayer',
 * });
 *
 * @dynamic {string} name - Name of the layer
 * @dynamic {string} key - Identifier of the layer. Must be unique.
 * @dynamic {boolean} isBaseLayer - Define if the layer is a base layer. Read-only.
 * @dynamic {boolean} isQueryable - Define if the layer can be queried. Read-only.
 * @dynamic {boolean} isReactSpatialLayer - Custom property for duck typing since `instanceof` is not working when the instance was created on different bundles. Read-only.
 * @dynamic {Layer[]} children - List of children.
 * @dynamic {string} copyright - Copyright.
 * @dynamic {boolean} visible - Define if the layer is visible or not.
 * @dynamic {Object} properties - Custom properties.
 * @dynamic {ol/Map~Map|mapbox.Map} map - The map where the layer is displayed.
 */
export default class Layer extends Observable {
  /**
   * Constructor
   *
   * @param {Object} options
   * @param {string} [options.name=uuid()] Layer name. Default use a generated uuid.
   * @param {string} [options.key=uuid().toLowerCase()] Layer key, will use options.name.toLowerCase() if not specified.
   * @param {string} [options.copyright=undefined] Copyright-Statement.
   * @param {Array<Layer>} [options.children=[]] Sublayers.
   * @param {Object} [options.properties={}] Application-specific layer properties.
   * @param {boolean} [options.visible=true] If true this layer is visible on the map.
   * @param {boolean} [options.isBaseLayer=false] If true this layer is a baseLayer.
   * @param {boolean} [options.isQueryable=false] If true feature information can be queried by the react-spatial LayerService. Default is undefined, but resulting to true if not strictly set to false.
   */
  constructor(options) {
    super();
    this.defineProperties(options);

    // Add click callback
    const { onClick } = options;
    if (onClick) {
      this.onClick(onClick);
    }
  }

  /**
   * Define layer's properties.
   *
   * @private
   */
  defineProperties({
    name,
    key,
    children,
    copyright,
    visible,
    properties,
    isBaseLayer,
    isQueryable,
  }) {
    const uid = uuid();
    const dfltName = name || uid;
    Object.defineProperties(this, {
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
      },
      // Custom property for duck typing since `instanceof` is not working
      // when the instance was created on different bundles.
      isReactSpatialLayer: {
        value: true,
      },
      children: {
        value: children || [],
        writable: true,
      },
      copyright: {
        get: () => {
          return this.get('copyright', copyright);
        },
        set: (newCopyright) => {
          return this.set('copyright', newCopyright);
        },
      },
      visible: {
        value: visible === undefined ? true : visible,
      },
      properties: {
        value: properties || {},
      },
      map: {
        writable: true,
      },
      /**
       * Callback function when a user click on a vehicle.
       */
      clickCallbacks: {
        value: [],
      },
    });
  }

  /**
   * Initialize the layer with the map passed in parameters.
   *
   * @private
   */
  init(map) {
    this.terminate();
    /** @ignore */
    this.map = map;
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   *
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  terminate() {}

  /**
   * Get a layer property.
   *
   * @param {string} name Property name.
   * @returns {property} Property
   */
  get(name) {
    return this.properties[name];
  }

  /**
   * Set a layer property.
   *
   * @param {string} name Property name.
   * @param {string} value Value.
   */
  set(name, value) {
    this.properties[name] = value;
    this.dispatchEvent({
      type: `change:${name}`,
      target: this,
    });
  }

  /**
   * Change the visibility of the layer
   *
   * @param {boolean} visible Defines the visibility of the layer
   * @param {boolean} [stopPropagationDown]
   * @param {boolean} [stopPropagationUp]
   * @param {boolean} [stopPropagationSiblings]
   */
  setVisible(
    visible,
    stopPropagationDown = false,
    stopPropagationUp = false,
    stopPropagationSiblings = false,
  ) {
    if (visible === this.visible) {
      return;
    }

    /** @ignore */
    this.visible = visible;

    this.dispatchEvent({
      type: 'change:visible',
      target: this,
      stopPropagationDown,
      stopPropagationUp,
      stopPropagationSiblings,
    });
  }

  /**
   * Returns an array with visible child layers
   *
   * @returns {Array<ol.layer>} Visible children
   */
  getVisibleChildren() {
    return this.children.filter((child) => child.visible);
  }

  /**
   * Checks whether the layer has child layers with visible set to True
   *
   * @returns {boolean} True if the layer has visible child layers
   * @private
   */
  hasVisibleChildren() {
    return !!this.hasChildren(true);
  }

  /**
   * Checks whether the layer has any child layers with visible equal to the input parameter
   *
   * @param {boolean} visible The state to check the childlayers against
   * @returns {boolean} True if the layer has children with the given visibility
   */
  hasChildren(visible) {
    return !!this.children.find((child) => child.visible === visible);
  }

  /**
   * Add a child layer
   *
   * @param {ol.layer} layer Child layer
   */
  addChild(layer) {
    this.children.unshift(layer);
    this.dispatchEvent({
      type: `change:children`,
      target: this,
    });
  }

  /**
   * Removes a child layer by layer name
   *
   * @param {string} name Layer name
   */
  removeChild(name) {
    for (let i = 0; i < this.children.length; i += 1) {
      if (this.children[i].name === name) {
        this.children.splice(i, 1);
        return;
      }
    }
    this.dispatchEvent({
      type: `change:children`,
      target: this,
    });
  }

  /**
   * Request feature information for a given coordinate.
   *
   * @param {ol.Coordinate} coordinate Coordinate to request the information at.
   * @returns {Promise<Object>} Promise with features, layer and coordinate
   *  or null if no feature was hit.
   */
  getFeatureInfoAtCoordinate() {
    // This layer returns no feature info.
    // The function is implemented by inheriting layers.
    return Promise.resolve({
      layer: this,
      features: [],
      coordinate: null,
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
      throw new Error('callback must be of type function.');
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
      if (idx >= -1) {
        this.clickCallbacks.splice(idx, 1);
      }
    }
  }
}
