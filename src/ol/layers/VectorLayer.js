import { unByKey } from 'ol/Observable';
import Layer from './Layer';

/**
 * A class representing vector layer to display on BasicMap
 * @class
 * @example
 * import { VectorLayer } from 'mobility-toolbox-js/ol';
 * @inheritDoc
 * @param {Object} [options]
 * @param {number} [options.hitTolerance=5] Pixel value of the click hitTolerance of clicks.
 */
class VectorLayer extends Layer {
  constructor(options = {}) {
    super(options);

    /** @ignore */
    this.hitTolerance = options.hitTolerance || 5;
  }

  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate the coordinate to request the information at.
   * @returns {Promise<Object>} Promise with features, layer and coordinate
   *  or null if no feature was hit.
   * eslint-disable-next-line class-methods-use-this
   */
  getFeatureInfoAtCoordinate(coordinate) {
    let features = [];

    if (this.map) {
      const pixel = this.map.getPixelFromCoordinate(coordinate);
      features = this.map.getFeaturesAtPixel(pixel, {
        layerFilter: (l) => l === this.olLayer,
        hitTolerance: this.hitTolerance,
      });
    }

    return Promise.resolve({
      features,
      layer: this,
      coordinate,
    });
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    /**
     * ol click events key, returned by map.on('singleclick')
     * @type {ol/events~EventsKey}
     * @private
     */
    this.singleClickRef = this.map.on('singleclick', (e) => {
      if (!this.clickCallbacks.length) {
        return;
      }

      this.getFeatureInfoAtCoordinate(e.coordinate)
        .then((d) => this.callClickCallbacks(d.features, d.layer, d.coordinate))
        .catch(() => this.callClickCallbacks([], this, e.coordinate));
    });
  }

  /**
   * Call click callbacks with given parameters.
   * This is done in a separate function for being able to modify the response.
   * @param {Array<ol/Feature~Feature>} features
   * @param {ol/layer/Layer~Layer} layer
   * @param {ol/coordinate~Coordinate} coordinate
   * @private
   */
  callClickCallbacks(features, layer, coordinate) {
    this.clickCallbacks.forEach((c) => c(features, layer, coordinate));
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  terminate() {
    super.terminate();
    if (this.singleClickRef) {
      unByKey(this.singleClickRef);
    }
  }
}

export default VectorLayer;
