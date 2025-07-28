import { MapLibreLayerRenderer } from '@geoblocks/ol-maplibre-layer/lib';

import type { MapLibreLayerTranslateZoomFunction } from '@geoblocks/ol-maplibre-layer/lib/MapLibreLayer';
import type { FrameState } from 'ol/Map';

import type { MaplibreLayer } from '../layers';

// /**
//  * This class is usea renderer for Maplibre Layer to be able to use the native ol
//  * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
//  * @private
//  */
// // @ts-expect-error
export default class MaplibreLayerRenderer extends MapLibreLayerRenderer {
  ignoreNextRender = false;

  constructor(
    layer: MaplibreLayer,
    translateZoom?: MapLibreLayerTranslateZoomFunction,
  ) {
    super(layer, translateZoom);
    this.setIsReady = this.setIsReady.bind(this);
    this.ignoreNextRender = false;
  }

  renderFrame(frameState: FrameState): HTMLElement {
    const layer = this.getLayer();
    const { mapLibreMap } = layer;
    const map = layer.getMapInternal();

    if (!layer || !map || !mapLibreMap) {
      // @ts-expect-error - can return null
      return null;
    }

    if (this.ready && this.ignoreNextRender) {
      this.ignoreNextRender = false;
      return mapLibreMap?.getContainer();
    }
    this.ready = false;
    this.ignoreNextRender = false;
    this.updateReadyState();

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

  updateReadyState() {
    this.getLayer()?.mapLibreMap?.off('idle', this.setIsReady);
    this.getLayer()?.mapLibreMap?.once('idle', this.setIsReady);
  }
}
