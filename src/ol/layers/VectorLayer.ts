import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';

import { LayerGetFeatureInfoResponse } from '../../types';
import Layer, { MobilityLayerOptions } from './Layer';

/**
 * @deprecated
 */
class VectorLayer extends Layer {
  /**
   * @deprecated
   */
  clone(newOptions: MobilityLayerOptions) {
    return new VectorLayer({ ...this.get('options'), ...newOptions });
  }

  /**
   * @deprecated
   */
  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
  ): Promise<LayerGetFeatureInfoResponse> {
    let features: Feature[] = [];

    const mapInternal = this.getMapInternal();
    if (mapInternal) {
      const pixel = mapInternal.getPixelFromCoordinate(coordinate);
      features =
        (mapInternal.getFeaturesAtPixel(pixel, {
          hitTolerance: this.get('hitTolerance') || 5,
          layerFilter: (l) => {
            return l === this;
          },
        }) as Feature[]) || [];
    }

    return Promise.resolve({
      coordinate,
      features,
      layer: this,
    });
  }
}

export default VectorLayer;
