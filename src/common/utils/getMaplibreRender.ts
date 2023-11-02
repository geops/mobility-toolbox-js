import { toLonLat } from 'ol/proj';
import { toDegrees } from 'ol/math';
import type { FrameState } from 'ol/Map';
import type { RenderFunction } from 'ol/layer/Layer';
import type { MaplibreLayer } from '../../ol';

/**
 * Return the render function fo the olLayer of a MaplibreLayer
 * @private
 *
 */

export default function getMaplibreRender(
  layer: MaplibreLayer,
): RenderFunction {
  let emptyDiv: HTMLElement;
  return (frameState: FrameState) => {
    const { map, mbMap } = layer;
    if (!map || !mbMap) {
      if (!emptyDiv) {
        emptyDiv = document.createElement('div');
      }
      return emptyDiv;
    }

    const canvas = mbMap.getCanvas();
    const { viewState } = frameState;

    const opacity = layer?.getOpacity() || 1;
    canvas.style.opacity = `${opacity}`;

    // adjust view parameters in mapbox
    mbMap.jumpTo({
      center: toLonLat(viewState.center) as [number, number],
      zoom: viewState.zoom - 1,
      bearing: toDegrees(-viewState.rotation),
    });

    if (!canvas.isConnected) {
      // The canvas is not connected to the DOM, request a map rendering at the next animation frame
      // to set the canvas size.
      map.render();
    } else if (
      canvas.width !== frameState.size[0] ||
      canvas.height !== frameState.size[1]
    ) {
      mbMap.resize();
    }

    mbMap.redraw();

    return mbMap.getContainer();
  };
}
