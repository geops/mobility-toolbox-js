import createCanvas from '../utils/createCanvas';

import type { AnyCanvas, AnyCanvasContext, StyleCache } from '../../types';

export const rotateCanvas = (canvas: AnyCanvas, rotation: number) => {
  const ctx = canvas.getContext('2d') as AnyCanvasContext;
  ctx?.translate(canvas.width / 2, canvas.height / 2);
  ctx?.rotate(rotation);
  ctx?.translate(-canvas.width / 2, -canvas.height / 2);
};

const arrowCache: Record<string, AnyCanvas | null> = {};

export const getArrowCanvas = (
  arrowSize: number[],
  fillColor: string,
  pixelRatio = 1,
): AnyCanvas | null => {
  const key = `${arrowSize.toString()},${fillColor},${pixelRatio}`;
  if (!arrowCache[key]) {
    // Create the arrow canvas
    const padding = 0 * pixelRatio;
    const canvas = createCanvas(
      arrowSize[0] * pixelRatio,
      arrowSize[1] * pixelRatio,
    );
    const ctx = canvas?.getContext('2d') as AnyCanvasContext;
    if (canvas && ctx) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(canvas.width - padding, canvas.height / 2);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(canvas.width - padding, canvas.height / 2);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.lineTo(padding, padding);
      ctx.stroke();
    }
    arrowCache[key] = canvas;
  }

  return arrowCache[key];
};

const bufferArrowCache: Record<string, AnyCanvas | null> = {};

export const getBufferArrowCanvas = (
  width: number,
  height: number,
  fillColor: string,
  arrowSize?: number[],
  rotation = 0,
  pixelRatio = 1,
  margin = 0,
): AnyCanvas | null => {
  if (!arrowSize) {
    return null;
  }
  const bufferKey = `${fillColor},${width},${height},${rotation},${pixelRatio},${margin}.${arrowSize.toString()}`;
  if (!bufferArrowCache[bufferKey]) {
    // Create a buffer canvas around the current vehicle to display properly the arrow
    const arrowCanvas = getArrowCanvas(arrowSize, fillColor, pixelRatio);
    if (arrowCanvas) {
      const bufferCanvas = createCanvas(
        width + arrowCanvas.width * 2 + margin * 2,
        height + arrowCanvas.height * 2 + margin * 2,
      );
      if (bufferCanvas) {
        const bufferCtx = bufferCanvas.getContext('2d') as AnyCanvasContext;

        rotateCanvas(bufferCanvas, -rotation);

        bufferCtx?.drawImage(
          arrowCanvas,
          bufferCanvas.width - arrowCanvas.width,
          bufferCanvas.height / 2 - arrowCanvas.height / 2 - margin / 2,
          arrowCanvas.width,
          arrowCanvas.height,
        );
      }
      bufferArrowCache[bufferKey] = bufferCanvas;
    }
  }

  return bufferArrowCache[bufferKey];
};

const cacheDelayBg: StyleCache = {};

/**
 * Draw circle delay background
 */
export const getDelayBgCanvas = (
  radius: number,
  color: string,
  pixelRatio = 1,
  blurWidth = 1,
) => {
  const key = `${radius}, ${color}, ${blurWidth}, ${pixelRatio}`;
  const padding = 1 * pixelRatio; // must be the same as circle padding
  const blur = blurWidth * pixelRatio;
  if (!cacheDelayBg[key]) {
    const size = radius * 2 + padding * 2 + blur * 2 + padding * 2;
    const canvas = createCanvas(size, size);
    const ctx = canvas?.getContext('2d') as AnyCanvasContext;

    if (canvas && ctx) {
      ctx.beginPath();
      ctx.arc(
        size / 2,
        size / 2,
        radius + padding + blur,
        0,
        2 * Math.PI,
        false,
      );
      ctx.fillStyle = color;
      ctx.filter = `blur(${blur}px)`;
      ctx.fill();
      cacheDelayBg[key] = canvas;
    }
  }
  return cacheDelayBg[key];
};

const cacheCanvasTextSize: Record<string, { height: number; width: number }> =
  {};
export const getCanvasTextSize = (
  text: string,
  font: string,
  color: string,
  outlineColor: string,
  outlineWidth: number,
  pixelRatio: number,
) => {
  const key = `${text}, ${font}, ${color}, ${outlineColor}, ${outlineWidth}, ${pixelRatio}`;
  if (!cacheCanvasTextSize[key]) {
    const canvas = createCanvas(300 * pixelRatio, 300 * pixelRatio);
    const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;

    if (canvas && ctx) {
      // We calcuate the text size first
      ctx.font = font;
      ctx.textBaseline = 'hanging';
      ctx.textAlign = 'left';
      ctx.fillStyle = color;
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth;
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      const textMetrics = ctx.measureText(text);
      const size = {
        height:
          textMetrics.fontBoundingBoxAscent +
          textMetrics.fontBoundingBoxDescent,
        width: textMetrics.width,
      };
      cacheCanvasTextSize[key] = size;
    }
  }
  return cacheCanvasTextSize[key];
};

const cacheDelayText: StyleCache = {};
/**
 * Draw delay text
 */
export const getDelayTextCanvas = (
  text: string,
  fontSize: number,
  font: string,
  color: string,
  outlineColor = '#000',
  pixelRatio = 1,
) => {
  const key = `${text}, ${font}, ${color}, ${outlineColor}, ${pixelRatio}`;
  const padding = 2 * pixelRatio;
  const lineWidth = 1.5 * pixelRatio;
  if (!cacheDelayText[key]) {
    const textSize = getCanvasTextSize(
      text,
      font,
      color,
      outlineColor,
      lineWidth,
      pixelRatio,
    );

    if (textSize?.width && textSize?.height) {
      const canvas = createCanvas(
        textSize.width + padding * 2,
        textSize.height + padding * 2,
      );
      const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;
      if (canvas && ctx) {
        // We calcuate the text size first
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = outlineColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'ideographic';
        ctx.strokeText(text, padding, canvas.height - padding);
        ctx.fillText(text, padding, canvas.height - padding);
        cacheDelayText[key] = canvas;
      }
    }
  }
  return cacheDelayText[key];
};

const cacheCircle: StyleCache = {};

/**
 * Draw colored circle with black border
 */
export const getCircleCanvas = (
  radius: number,
  color: string,
  hasStroke: boolean,
  hasDash: boolean,
  pixelRatio: number,
) => {
  const key = `${radius}, ${color}, ${hasStroke},  ${hasDash}, ${pixelRatio}`;
  const padding = 1 * pixelRatio;
  const lineWidth = hasStroke ? 1 * pixelRatio : 0;
  const lineDash = hasDash ? [5 * pixelRatio, 3 * pixelRatio] : null;
  if (!cacheCircle[key]) {
    const canvas = createCanvas(
      radius * 2 + padding * 2,
      radius * 2 + padding * 2,
    );
    if (canvas) {
      const ctx = canvas.getContext('2d') as AnyCanvasContext;
      if (!ctx) {
        return null;
      }
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        radius,
        0,
        2 * Math.PI,
        false,
      );
      ctx.fill();

      if (lineDash) {
        ctx.setLineDash(lineDash);
      }

      ctx.stroke();

      cacheCircle[key] = canvas;
    }
  }
  return cacheCircle[key];
};

const cacheText: StyleCache = {};

/**
 * Draw text in the circle
 */
export const getTextCanvas = (
  text: string,
  radius: number,
  textSize: number,
  fillColor: string,
  strokeColor: string,
  hasStroke: boolean,
  pixelRatio: number,
  font: string,
) => {
  const key = `${text}, ${radius}, ${textSize}, ${fillColor},${strokeColor}, ${hasStroke}, ${pixelRatio}`;
  if (!cacheText[key]) {
    const canvas = createCanvas(radius * 2, radius * 2);
    if (canvas) {
      const ctx = canvas.getContext('2d') as AnyCanvasContext;
      if (!ctx) {
        return null;
      }

      // Draw a stroke to the text only if a provider provides realtime but we don't use it.
      if (hasStroke) {
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = font;
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(text, radius, radius);
        ctx.restore();
      }

      // Draw a text
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = fillColor;
      ctx.font = font;
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(text, radius, radius);
      ctx.fillText(text, radius, radius);

      cacheText[key] = canvas;
    }
  }
  return cacheText[key];
};
