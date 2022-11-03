import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { LayerGetFeatureInfoResponse } from '../../types';
import Layer, { OlLayerOptions } from './Layer';

/**
 * A class use to display vector data.
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
class VectorLayer extends Layer {
  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate the coordinate to request the information at.
   * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate.
   */
  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
  ): Promise<LayerGetFeatureInfoResponse> {
    let features: Feature[] = [];

    if (this.map) {
      const pixel = this.map.getPixelFromCoordinate(coordinate);
      features = this.map.getFeaturesAtPixel(pixel, {
        layerFilter: (l) => l === this.olLayer,
        hitTolerance: this.hitTolerance,
      }) as Feature[];
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
   * @return {VectorLayer} A VectorLayer
   */
  clone(newOptions: OlLayerOptions) {
    return new VectorLayer({ ...this.options, ...newOptions });
  }
}

export default VectorLayer;
