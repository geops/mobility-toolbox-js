import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { LayerGetFeatureInfoResponse } from '../../types';
import Layer from './Layer';
import { MobilityLayerOptions } from '../mixins/MobilityLayerMixin';

/**
 * @deprecated
 */
class VectorLayer extends Layer {
  /**
   * @deprecated
   */
  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
  ): Promise<LayerGetFeatureInfoResponse> {
    let features: Feature[] = [];

    if (this.map) {
      const pixel = this.map.getPixelFromCoordinate(coordinate);
      features = this.map.getFeaturesAtPixel(pixel, {
        layerFilter: (l) => l === this.olLayer,
        hitTolerance: this.hitTolerance || 5,
      }) as Feature[];
    }

    return Promise.resolve({
      features,
      layer: this,
      coordinate,
    });
  }

  /**
   * @deprecated
   */
  clone(newOptions: MobilityLayerOptions) {
    return new VectorLayer({ ...this.options, ...newOptions });
  }
}

export default VectorLayer;
