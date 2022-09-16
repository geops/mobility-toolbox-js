/* eslint-disable no-underscore-dangle */
import { FrameState } from 'ol/PluggableMap';
import { toLonLat } from 'ol/proj';
import { MapboxLayer } from '../../ol';
/**
 * Return the render function fo the olLayer of a MaplibreLayer
 */
export default function getMapboxRender(
  mapoxLayer: MapboxLayer,
): (frameState: FrameState) => HTMLElement {
  return (frameState) => {
    const { map, mbMap, renderState, olLayer } = mapoxLayer;
    if (!map || !mbMap) {
      return document.createElement('div');
    }
    let changed = false;
    const canvas = mbMap.getCanvas();
    const { viewState } = frameState;

    const visible = olLayer?.getVisible();
    if (renderState && renderState?.visible !== visible) {
      canvas.style.display = visible ? 'block' : 'none';
      renderState.visible = visible;
      // Needed since mapbox-gl 1.9.0.
      // Without you don't see others ol layers on top.
      canvas.style.position = 'absolute';
    }

    const opacity = olLayer?.getOpacity();
    if (canvas && renderState && renderState.opacity !== opacity) {
      // @ts-ignore
      canvas.style.opacity = opacity;
      renderState.opacity = opacity;
    }

    // adjust view parameters in mapbox
    const { rotation } = viewState;
    if (renderState && renderState.rotation !== rotation) {
      mbMap.rotateTo((-(rotation || 0) * 180) / Math.PI, {
        animate: false,
      });
      changed = true;
      renderState.rotation = rotation;
    }

    if (
      renderState &&
      renderState.center &&
      (renderState.zoom !== viewState.zoom ||
        renderState.center[0] !== viewState.center[0] ||
        renderState.center[1] !== viewState.center[1])
    ) {
      mbMap.jumpTo({
        center: toLonLat(viewState.center) as [number, number],
        zoom: viewState.zoom - 1,
      });
      changed = true;
      renderState.zoom = viewState.zoom;
      renderState.center = viewState.center;
    }

    const size = map.getSize() || [0, 0];
    if (
      renderState &&
      renderState.size &&
      (renderState.size[0] !== size[0] || renderState.size[1] !== size[1])
    ) {
      changed = true;
      renderState.size = size;
    }

    // cancel the scheduled update & trigger synchronous redraw
    // see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
    // NOTE: THIS MIGHT BREAK WHEN UPDATING MAPBOX
    // @ts-ignore
    if (mbMap && mbMap.style && mbMap.isStyleLoaded() && changed) {
      try {
        // @ts-ignore
        if (mbMap._frame) {
          // @ts-ignore
          mbMap._frame.cancel();
          // @ts-ignore
          mbMap._frame = null;
        }
        // @ts-ignore
        mbMap._render();
      } catch (err) {
        // ignore render errors because it's probably related to
        // a render during an update of the style.
        // eslint-disable-next-line no-console
        console.warn(err);
      }
    }

    return mbMap.getContainer();
  };
}
