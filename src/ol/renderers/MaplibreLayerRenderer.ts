import { MapLibreLayerRenderer } from '@geoblocks/ol-maplibre-layer/lib';
import { toDegrees } from 'ol/math.js';
import { toLonLat } from 'ol/proj';

import type { MapLibreLayerTranslateZoomFunction } from '@geoblocks/ol-maplibre-layer/lib/MapLibreLayer';
import type { FrameState } from 'ol/Map';

import type { MaplibreLayer } from '../layers';

function sameSize(canvas: HTMLCanvasElement, frameState: FrameState): boolean {
  return (
    canvas.width === Math.floor(frameState.size[0] * frameState.pixelRatio) &&
    canvas.height === Math.floor(frameState.size[1] * frameState.pixelRatio)
  );
}
// /**
//  * This class is usea renderer for Maplibre Layer to be able to use the native ol
//  * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
//  * @private
//  */
// // @ts-expect-error
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

    const container = this.renderFrame2(frameState);

    // Mark the renderer as ready when the map is idle
    mapLibreMap?.once('idle', this.setIsReady);

    return container;
  }
  renderFrame2(frameState: FrameState): HTMLElement {
    const layer = this.getLayer();
    const { mapLibreMap } = layer;
    const map = layer.getMapInternal();
    if (!layer || !map || !mapLibreMap) {
      return document.createElement('div');
    }

    const mapLibreCanvas = mapLibreMap.getCanvas();
    const { viewState } = frameState;

    // adjust view parameters in MapLibre
    mapLibreMap.jumpTo({
      bearing: toDegrees(-viewState.rotation),
      center: toLonLat(viewState.center, viewState.projection) as [
        number,
        number,
      ],
      zoom:
        (this.tranaslateZoom2
          ? this.tranaslateZoom2(viewState.zoom)
          : viewState.zoom) - 1,
    });

    const opacity = layer.getOpacity().toString();
    if (mapLibreCanvas && opacity !== mapLibreCanvas.style.opacity) {
      mapLibreCanvas.style.opacity = opacity;
    }

    if (!mapLibreCanvas.isConnected) {
      // The canvas is not connected to the DOM, request a map rendering at the next animation frame
      // to set the canvas size.
      map.render();
    } else if (!sameSize(mapLibreCanvas, frameState)) {
      mapLibreMap.resize();
    }

    mapLibreMap.redraw();

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
    this.getLayer()?.mapLibreMap?.off('idle', this.setIsReady);
    this.getLayer()?.mapLibreMap?.once('idle', this.setIsReady);
  }
}
