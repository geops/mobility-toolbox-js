import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';

import { LayerGetFeatureInfoResponse } from '../../types';
import { MobilityLayerOptions } from '../mixins/MobilityLayerMixin';

import Layer from './Layer';

/**
 * @deprecated
 */
class VectorLayer extends Layer {
  /**
   * @deprecated
   */
  clone(newOptions: MobilityLayerOptions) {
    return new VectorLayer({ ...this.options, ...newOptions });
  }

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
        hitTolerance: this.hitTolerance || 5,
        layerFilter: (l) => l === this.olLayer,
      }) as Feature[];
    }

    return Promise.resolve({
      coordinate,
      features,
      layer: this,
    });
  }
}

export default VectorLayer;
