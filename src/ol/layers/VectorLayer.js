import Layer from './Layer';

/**
 * A class use to display vector data.
 *
 * @extends {Layer}
 */
class VectorLayer extends Layer {
  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate the coordinate to request the information at.
   * @returns {Promise<{layer: Layer, features: ol/Feature~Feature[], coordinate: number[2]}} Promise with features, layer and coordinate.
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
   * Create a copy of the VectorLayer.
   * @param {Object} newOptions Options to override
   * @returns {VectorLayer} A VectorLayer
   */
  clone(newOptions) {
    return new VectorLayer({ ...this.options, ...newOptions });
  }
}

export default VectorLayer;
