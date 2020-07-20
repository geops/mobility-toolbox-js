import { unByKey } from 'ol/Observable';
import Layer from './Layer';

/**
 * A class representing vector layer to display on BasicMap
 * @class
 * @example
 * import { VectorLayer } from 'mobility-toolbox-js/ol';
 * @inheritDoc
 * @param {Object} [options]
 */
class VectorLayer extends Layer {
  constructor(options = {}) {
    super(options);

    this.hitTolerance = options.hitTolerance || 5;
  }

  /**
   * Request feature information for a given coordinate.
   * @param {ol.Coordinate} coordinate {@link https://openlayers.org/en/latest/apidoc/module-ol_coordinate.html ol/Coordinate} to request the information at.
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
   * @param {ol/Map~Map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map}
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    // Listen to click events
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
