import createCanvas from '../utils/createCanvas';
import { getBgColor } from '../utils/realtimeConfig';

import realtimeDefaultStyle from './realtimeDefaultStyle';

import type {
  AnyCanvas,
  AnyCanvasContext,
  RealtimeStyleFunction,
  RealtimeStyleOptions,
  RealtimeTrajectory,
  ViewState,
} from '../../types';

const rotateCanvas = (canvas: AnyCanvas, rotation: number) => {
  const ctx = canvas.getContext('2d') as AnyCanvasContext;
  ctx?.translate(canvas.width / 2, canvas.height / 2);
  ctx?.rotate(rotation);
  ctx?.translate(-canvas.width / 2, -canvas.height / 2);
};

const arrowCache: Record<string, AnyCanvas | null> = {};

const getArrowCanvas = (fillColor: string): AnyCanvas | null => {
  const key = `${fillColor}`;
  if (!arrowCache[key]) {
    // Create the arrow canvas
    const arrowCanvas = createCanvas(20, 20);
    const ctx = arrowCanvas?.getContext('2d') as AnyCanvasContext;
    if (ctx) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(5, 5);
      ctx.lineTo(10, 10);
      ctx.lineTo(5, 15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(5, 5);
      ctx.lineTo(10, 10);
      ctx.lineTo(5, 15);
      ctx.lineTo(5, 5);
      ctx.stroke();
    }
    arrowCache[key] = arrowCanvas;
  }

  return arrowCache[key];
};

const bufferArrowCache: Record<string, AnyCanvas | null> = {};

const getBufferArrowCanvas = (
  canvas: AnyCanvas,
  fillColor: string,
  rotation = 0,
): AnyCanvas | null => {
  const margin = 20;
  const bufferKey = `${fillColor},${canvas.width},${canvas.height},${rotation}`;
  if (!bufferArrowCache[bufferKey]) {
    // Create a buffer canvas around the current vehicle to display properly the arrow
    const buffer = createCanvas(
      canvas.width + margin * 2,
      canvas.height + margin * 2,
    );
    const arrowCanvas = getArrowCanvas(fillColor);
    if (arrowCanvas && buffer) {
      const bufferCtx = buffer.getContext('2d') as AnyCanvasContext;

      const rot = rotation + (90 * Math.PI) / 180;
      rotateCanvas(buffer, -rot);

      bufferCtx?.drawImage(
        arrowCanvas,
        buffer.width - margin,
        buffer.height / 2 - arrowCanvas.height / 2,
        arrowCanvas.width,
        arrowCanvas.height,
      );
    }

    bufferArrowCache[bufferKey] = buffer;
  }

  return bufferArrowCache[bufferKey];
};

/**
 * @deprecated use realtimeDefaultStyle with useHeadingStyle option instead
 */
const realtimeHeadingStyle: RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => {
  return realtimeDefaultStyle(trajectory, viewState, {
    ...options,
    useHeadingStyle: true,
  });
};
export default realtimeHeadingStyle;
