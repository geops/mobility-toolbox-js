import { MapLibreLayerRenderer } from '@geoblocks/ol-maplibre-layer/lib';
import { Layer } from 'ol/layer';
import { FrameState } from 'ol/Map';

import { MaplibreLayer } from '../layers';

// /**
//  * This class is usea renderer for Maplibre Layer to be able to use the native ol
//  * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
//  * @private
//  */
// // @ts-expect-error
export default class MaplibreLayerRenderer extends MapLibreLayerRenderer {
  ignoreNextRender = false;

  constructor(layer: MaplibreLayer) {
    super(layer);
    this.setIsReady = this.setIsReady.bind(this);
    this.ignoreNextRender = false;
  }

  renderFrame(frameState: FrameState): HTMLElement {
    this.getLayer()?.mapLibreMap?.off('idle', this.setIsReady);

    const mapLibreMap = this.getLayer()?.mapLibreMap;
    mapLibreMap?.off('idle', this.setIsReady);

    if (this.ignoreNextRender) {
      this.ignoreNextRender = false;
      const container = mapLibreMap?.getContainer();
      if (container) {
        return container;
      }
    }
    this.ready = false;
    const container = super.renderFrame(frameState);

    // Mark the renderer as ready when the map is idle
    mapLibreMap?.once('idle', this.setIsReady);

    return container;
  }

  setIsReady() {
    if (!this.ready) {
      this.ready = true;
      this.ignoreNextRender = true;
      this.getLayer().changed();
    }
  }
}
