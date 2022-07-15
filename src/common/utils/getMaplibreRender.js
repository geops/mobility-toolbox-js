import { toLonLat } from 'ol/proj';
import { toDegrees } from 'ol/math';

/**
 * Return the render function fo the olLayer of a MaplibreLayer
 */
export default function getMaplibreRender(maplibreLayer) {
  return (frameState) => {
    const { map, mbMap, olLayer } = maplibreLayer;
    if (!map || !mbMap) {
      return null;
    }

    const canvas = mbMap.getCanvas();
    const { viewState } = frameState;

    const opacity = olLayer.getOpacity();
    canvas.style.opacity = opacity;

    // adjust view parameters in mapbox
    mbMap.jumpTo({
      center: toLonLat(viewState.center),
      zoom: viewState.zoom - 1,
      bearing: toDegrees(-viewState.rotation),
      animate: false,
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
