import { AnyCanvas } from '../../types';

/**
 * This function try to create a canvas element and return it.
 * it uses document.createElement('canvas') if document is available
 * or new OffscreenCanvas(width, height) if OffscreenCanvas is avalaible (for web worker)
 * or it returns null if neither is available.
 */
const createCanvas = (width: number, height: number): AnyCanvas | null => {
  let canvas = null;

  // Prevent SSR errors
  if (typeof window === 'undefined') {
    return null;
  }

  if (typeof document !== 'undefined' && document?.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  } else if (OffscreenCanvas) {
    canvas = new OffscreenCanvas(width, height);
  } else {
    // eslint-disable-next-line no-console
    console.error(
      "We didn't find a way to create a canvas element, document.createElement('canvas') and new OffscrenCanvas() are not supported",
    );
  }
  return canvas;
};

export default createCanvas;
