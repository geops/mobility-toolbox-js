import { Vector } from 'ol/layer';

import defineDeprecatedProperties from '../utils/defineDeprecatedProperties';

import { deprecated } from './MaplibreLayer';

import type { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Options } from 'ol/layer/Vector';

import type { LayerGetFeatureInfoResponse } from '../../types';

import type { MobilityLayerOptions } from './Layer';

/**
 * @deprecated
 */
class VectorLayer extends Vector {
  constructor(options: MobilityLayerOptions & Options) {
    if (!options.source && (options.olLayer as Vector)?.getSource()) {
      options.source = (options.olLayer as Vector)?.getSource?.() ?? undefined;
    }
    super(options);

    defineDeprecatedProperties(this, options as MobilityLayerOptions);
    deprecated('Layer is deprecated. Use an OpenLayers Layer instead.');

    // Backward compatibility
    // @ts-expect-error Property just there for backward compatibility
    this.olEventsKeys = [];
  }

  /**
   * @deprecated
   */
  clone(newOptions: MobilityLayerOptions & Options) {
    return new VectorLayer({
      ...(this.get('options') as MobilityLayerOptions & Options),
      ...newOptions,
    });
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
          hitTolerance: (this.get('hitTolerance') as number) || 5,
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
