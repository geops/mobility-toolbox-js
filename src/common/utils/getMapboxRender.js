/* eslint-disable no-underscore-dangle */
import { toLonLat } from 'ol/proj';

/**
 * Return the render function fo the olLayer of a MaplibreLayer
 */
export default function getMapboxRender(mapoxLayer) {
  return (frameState) => {
    const { map, mbMap, renderState, olLayer } = mapoxLayer;
    if (!map || !mbMap) {
      return null;
    }
    let changed = false;
    const canvas = mbMap.getCanvas();
    const { viewState } = frameState;

    const visible = olLayer.getVisible();
    if (renderState.visible !== visible) {
      canvas.style.display = visible ? 'block' : 'none';
      renderState.visible = visible;
      // Needed since mapbox-gl 1.9.0.
      // Without you don't see others ol layers on top.
      canvas.style.position = 'absolute';
    }

    const opacity = olLayer.getOpacity();
    if (renderState.opacity !== opacity) {
      canvas.style.opacity = opacity;
      renderState.opacity = opacity;
    }

    // adjust view parameters in mapbox
    const { rotation } = viewState;
    if (renderState.rotation !== rotation) {
      mbMap.rotateTo((-(rotation || 0) * 180) / Math.PI, {
        animate: false,
      });
      changed = true;
      renderState.rotation = rotation;
    }

    if (
      renderState.zoom !== viewState.zoom ||
      renderState.center[0] !== viewState.center[0] ||
      renderState.center[1] !== viewState.center[1]
    ) {
      mbMap.jumpTo({
        center: toLonLat(viewState.center),
        zoom: viewState.zoom - 1,
        animate: false,
      });
      changed = true;
      renderState.zoom = viewState.zoom;
      renderState.center = viewState.center;
    }

    const size = map.getSize();
    if (renderState.size[0] !== size[0] || renderState.size[1] !== size[1]) {
      changed = true;
      renderState.size = size;
    }

    // cancel the scheduled update & trigger synchronous redraw
    // see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
    // NOTE: THIS MIGHT BREAK WHEN UPDATING MAPBOX
    if (mbMap && mbMap.style && mbMap.isStyleLoaded() && changed) {
      try {
        if (mbMap._frame) {
          mbMap._frame.cancel();
          mbMap._frame = null;
        }
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
