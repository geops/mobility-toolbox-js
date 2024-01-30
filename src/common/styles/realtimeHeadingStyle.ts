import type {
  RealtimeTrajectory,
  ViewState,
  RealtimeStyleOptions,
  RealtimeStyleFunction,
  AnyCanvas,
} from '../../types';
import createCanvas from '../utils/createCanvas';
import { getBgColor } from '../utils/realtimeConfig';
import realtimeDefaultStyle from './realtimeDefaultStyle';

/** @private */
const rotateCanvas = (canvas: AnyCanvas, rotation: number) => {
  const ctx = canvas.getContext('2d');
  ctx?.translate(canvas.width / 2, canvas.height / 2);
  ctx?.rotate(rotation);
  ctx?.translate(-canvas.width / 2, -canvas.height / 2);
};

/** @private */
const arrowCache: {
  [key: string]: AnyCanvas | null;
} = {};

/** @private */
const getArrowCanvas = (fillColor: string): AnyCanvas | null => {
  const key = `${fillColor}`;
  if (!arrowCache[key]) {
    // Create the arrow canvas
    const arrowCanvas = createCanvas(20, 20);
    const ctx = arrowCanvas?.getContext('2d');
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

/** @private */
const bufferArrowCache: {
  [key: string]: AnyCanvas | null;
} = {};

/** @private */
const getBufferArrowCanvas = (
  canvas: AnyCanvas,
  fillColor: string,
  rotation: number,
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
      const bufferCtx = buffer.getContext('2d');
      bufferCtx?.drawImage(
        arrowCanvas,
        buffer.width - margin,
        buffer.height / 2 - arrowCanvas.height / 2,
        arrowCanvas.width,
        arrowCanvas.height,
      );
      bufferCtx?.save();
      const rot = rotation + (90 * Math.PI) / 180;
      rotateCanvas(buffer, -rot);
      bufferCtx?.restore();
    }

    bufferArrowCache[bufferKey] = buffer;
  }

  return bufferArrowCache[bufferKey];
};

/**
 * A tracker style that take in account the delay.
 *
 * @param {RealtimeTrajectory} trajectory The trajectory to render.
 * @param {ViewState} viewState The view state of the map.
 * @param {RealtimeStyleOptions} options Some options to change the rendering
 * @return a canvas
 * @private
 */
const realtimeHeadingStyle: RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => {
  // @ts-ignore
  const { rotation, type, line } = trajectory.properties;
  const { color } = line || {};

  const canvas = realtimeDefaultStyle(trajectory, viewState, options);

  if (canvas && rotation !== null) {
    const circleFillColor = color || getBgColor(type);
    const bufferArrow = getBufferArrowCanvas(canvas, circleFillColor, rotation);
    if (bufferArrow) {
      const bufferSize = (bufferArrow.width - canvas.width) / 2;
      const vehicleWithArrow = createCanvas(
        bufferArrow.width,
        bufferArrow.height,
      );
      vehicleWithArrow
        ?.getContext('2d')
        ?.drawImage(bufferArrow, 0, 0, bufferArrow.width, bufferArrow.height);
      vehicleWithArrow
        ?.getContext('2d')
        ?.drawImage(
          canvas,
          bufferSize,
          bufferSize,
          canvas.width,
          canvas.height,
        );
      return vehicleWithArrow;
    }
  }
  return canvas;
};
export default realtimeHeadingStyle;
