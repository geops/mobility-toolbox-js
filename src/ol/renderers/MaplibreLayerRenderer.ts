import { MapLibreLayerRenderer } from '@geoblocks/ol-maplibre-layer/lib';

import type { MapLibreLayerTranslateZoomFunction } from '@geoblocks/ol-maplibre-layer/lib/MapLibreLayer';
import type { FrameState } from 'ol/Map';

import type { MaplibreLayer } from '../layers';

/**
 * This class is usea renderer for Maplibre Layer to be able to use the native ol
 * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
 * @private
 */
export default class MaplibreLayerRenderer extends MapLibreLayerRenderer {
  ignoreNextRender = false;
  tranaslateZoom2: MapLibreLayerTranslateZoomFunction | undefined;

  constructor(
    layer: MaplibreLayer,
    translateZoom?: MapLibreLayerTranslateZoomFunction,
  ) {
    super(layer, translateZoom);
    this.tranaslateZoom2 = translateZoom;

    this.setIsReady = this.setIsReady.bind(this);
    this.ignoreNextRender = false;
  }

  override prepareFrame(): boolean {
    return true;
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

    super.renderFrame(frameState);

    const mapLibreCanvas = mapLibreMap.getCanvas();
    if (
      mapLibreCanvas.clientWidth !==
        Math.floor(frameState.size[0] * frameState.pixelRatio) ||
      mapLibreCanvas.clientHeight !==
        Math.floor(frameState.size[1] * frameState.pixelRatio) ||
      mapLibreCanvas.style.width !== `${frameState.size[0]}px` ||
      mapLibreCanvas.style.height !== `${frameState.size[1]}px`
    ) {
      if (
        mapLibreCanvas.clientWidth !==
          Math.floor(frameState.size[0] * frameState.pixelRatio) ||
        mapLibreCanvas.clientHeight !==
          Math.floor(frameState.size[1] * frameState.pixelRatio)
      ) {
        console.log('MapLibre canvas size is not correct, resizing...');

        // Force resize
        // mapLibreMap.resize();
        // mapLibreMap.redraw();
      }
      if (
        mapLibreCanvas.style.width !== `${frameState.size[0]}px` ||
        mapLibreCanvas.style.height !== `${frameState.size[1]}px`
      ) {
        console.log('MapLibre canvas style size is not correct, resizing...');

        // Force resize
        mapLibreMap.resize();
        mapLibreMap.redraw();
      }
    }

    // Mark the renderer as ready when the map is idle
    void mapLibreMap?.once('idle', this.setIsReady.bind(this));

    return mapLibreMap.getContainer();
  }

  setIsReady() {
    if (!this.ready) {
      this.ready = true;
      this.ignoreNextRender = true;
      this.getLayer().changed();
    }
  }

  updateReadyState() {
    void this.getLayer()?.mapLibreMap?.off('idle', this.setIsReady.bind(this));
    void this.getLayer()?.mapLibreMap?.once('idle', this.setIsReady.bind(this));
  }
}
