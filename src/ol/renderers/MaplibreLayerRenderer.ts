import { MapLibreLayerRenderer } from '@geoblocks/ol-maplibre-layer/lib';
import { toDegrees } from 'ol/math.js';
import { toLonLat } from 'ol/proj';

import type { MapLibreLayerTranslateZoomFunction } from '@geoblocks/ol-maplibre-layer/lib/MapLibreLayer';
import type { Map } from 'maplibre-gl';
import type { FrameState } from 'ol/Map';

import type { MaplibreLayer } from '../layers';

function sameSize(map: Map, frameState: FrameState): boolean {
  return (
    map.transform.width === Math.floor(frameState.size[0]) &&
    map.transform.height === Math.floor(frameState.size[1])
  );
}

/**
 * This class is usea renderer for Maplibre Layer to be able to use the native ol
 * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
 * @private
 */
export default class MaplibreLayerRenderer extends MapLibreLayerRenderer {
  ignoreNextRender = false;
  translateZoom2: MapLibreLayerTranslateZoomFunction | undefined;

  constructor(
    layer: MaplibreLayer,
    translateZoom?: MapLibreLayerTranslateZoomFunction,
  ) {
    super(layer, translateZoom);
    this.translateZoom2 = translateZoom;
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    void mapLibreMap.off('idle', this.setIsReady);

    // When the browser is zoomed it could happens that the renderFrame call for readyness
    // in setIsReady is called with a different size than the one of the mapLibreMap,
    // so we need to render.
    if (
      this.ready &&
      this.ignoreNextRender &&
      sameSize(mapLibreMap, frameState)
    ) {
      this.ignoreNextRender = false;
      return mapLibreMap.getContainer();
    }

    this.ready = false;
    this.ignoreNextRender = false;
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
        (this.translateZoom2
          ? this.translateZoom2(viewState.zoom)
          : viewState.zoom) - 1,
    });

    const opacity = layer.getOpacity().toString();
    if (opacity !== mapLibreCanvas?.style.opacity) {
      mapLibreCanvas.style.opacity = opacity;
    }

    if (!mapLibreCanvas.isConnected) {
      // The canvas is not connected to the DOM, request a map rendering at the next animation frame
      // to set the canvas size.
      map.render();
    } else if (!sameSize(mapLibreMap, frameState)) {
      mapLibreMap.resize();
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    void mapLibreMap.once('idle', this.setIsReady);

    mapLibreMap.redraw();

    return mapLibreMap.getCanvasContainer();
  }

  setIsReady() {
    if (!this.ready) {
      this.ready = true;
      this.ignoreNextRender = true;
      this.getLayer()?.changed();
    }
  }
}
