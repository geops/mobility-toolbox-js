import { buffer } from 'ol/size';

import createCanvas from '../utils/createCanvas';

import type { StyleOptions } from 'maplibre-gl';

import type {
  AnyCanvas,
  AnyCanvasContext,
  RealtimeStyleFunction,
  RealtimeStyleOptions,
  RealtimeTrajectory,
  StyleCache,
  ViewState,
} from '../../types';

const rotateCanvas = (canvas: AnyCanvas, rotation: number) => {
  const ctx = canvas.getContext('2d') as AnyCanvasContext;
  ctx?.translate(canvas.width / 2, canvas.height / 2);
  ctx?.rotate(rotation);
  ctx?.translate(-canvas.width / 2, -canvas.height / 2);
};

const arrowCache: Record<string, AnyCanvas | null> = {};

const getArrowCanvas = (
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

const getBufferArrowCanvas = (
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
 *
 * @private
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
const getCanvasTextSize = (
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
 *
 * @private
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
 *
 * @private
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
 *
 * @private
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

const cache: StyleCache = {};

/**
 * A tracker style that take in account the delay.
 *
 * @param {RealtimeTrajectory} trajectory The trajectory to render.
 * @param {ViewState} viewState The view state of the map.
 * @param {RealtimeStyleOptions} options Some options to change the rendering
 * @return a canvas
 * @private
 */
const realtimeDefaultStyle: RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => {
  const {
    delayDisplay = 300000,
    delayOutlineColor = '#000',
    getArrowSize = (traj, viewSt, radius = 0) => {
      return [(radius * 3) / 4, radius];
    },
    getColor = (traj: RealtimeTrajectory): string => {
      let color = traj?.properties?.line?.color;

      if (color && !color.startsWith('#')) {
        color = `#${color}`;
      }
      return color || '#000';
    },
    getDelayColor = (traj: RealtimeTrajectory) => {
      return traj?.properties?.line?.color || '#000';
    },
    getDelayFont = (traj, viewSt, fontSize: number) => {
      return `bold ${fontSize}px arial, sans-serif`;
    },
    getDelayText = () => {
      return null;
    },
    getDelayTextColor = () => {
      return '#000';
    },
    getImage = () => {
      return null;
    },
    getMaxRadiusForStrokeAndDelay = () => {
      return 7;
    },
    getMaxRadiusForText = () => {
      return 10;
    },
    getRadius = () => {
      return 5;
    },
    getText = (traj: RealtimeTrajectory) => {
      return traj?.properties?.line?.name || '';
    },
    getTextColor = (traj: RealtimeTrajectory) => {
      let color = traj?.properties?.line?.text_color;

      if (color && !color.startsWith('#')) {
        color = `#${color}`;
      }
      return color || '#fff';
    },
    getTextFont = (
      traj: RealtimeTrajectory,
      viewSt: ViewState,
      fontSize: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      text?: string,
    ) => {
      return `bold ${fontSize}px arial, sans-serif`;
    },
    getTextSize = () => {
      return 14;
    },
    hoverVehicleId,
    selectedVehicleId,
    showDelayBg = true,
    useDelayStyle,
    useHeadingStyle,
  } = options;

  const { pixelRatio = 1 } = viewState;
  const {
    delay,
    operator_provides_realtime_journey: operatorProvidesRealtime,
    rotation,
    state,
    train_id: id,
  } = trajectory.properties;

  const name = getText(trajectory, viewState);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  let color = getColor(trajectory, viewState);
  let textColor = getTextColor(trajectory, viewState);

  const cancelled = state === 'JOURNEY_CANCELLED';
  const hover = !!(hoverVehicleId && hoverVehicleId === id);
  const selected = !!(selectedVehicleId && selectedVehicleId === id);

  // Get the text color of the vehicle
  if (useDelayStyle) {
    color = getDelayColor(trajectory, viewState, delay, cancelled);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    textColor = getDelayTextColor(trajectory, viewState, delay, cancelled);
  }

  // Calcul the radius of the circle
  let radius = getRadius(trajectory, viewState) * pixelRatio;
  const isDisplayStrokeAndDelay =
    radius >= getMaxRadiusForStrokeAndDelay() * pixelRatio;

  if (hover || selected) {
    radius = isDisplayStrokeAndDelay
      ? radius + 5 * pixelRatio
      : 14 * pixelRatio;
  }
  const isDisplayText = radius > getMaxRadiusForText() * pixelRatio;

  // Optimize the cache key, very important in high zoom level
  let key = `${radius}${hover || selected}${useHeadingStyle ? rotation : ''}`;

  if (useDelayStyle) {
    key += `${operatorProvidesRealtime}${delay}${cancelled}`;
  } else {
    key += `${color}`;

    if (isDisplayStrokeAndDelay) {
      key += `${cancelled}${delay}`;
    }
  }

  if (isDisplayText) {
    key += `${name}${textColor}`;
  }

  if (!cache[key]) {
    if (radius === 0) {
      return null;
    }

    // Get the color of the vehicle
    const circleFillColor = color as string;

    const hasStroke = isDisplayStrokeAndDelay || hover || selected;

    const hasDash =
      !!isDisplayStrokeAndDelay &&
      !!useDelayStyle &&
      delay === null &&
      operatorProvidesRealtime === 'yes';

    const hasDelayText =
      isDisplayStrokeAndDelay &&
      (hover || (delay || 0) >= delayDisplay || cancelled);

    const hasDelayBg =
      !!showDelayBg && isDisplayStrokeAndDelay && delay !== null;

    const hasHeading = useHeadingStyle && isDisplayText && rotation;

    // Show delay if feature is hovered or if delay is above 5mins
    let fontSize = 0;
    let text = null;
    if (hasDelayText) {
      // Draw delay text
      fontSize =
        Math.max(
          cancelled ? 19 : 14,
          Math.min(cancelled ? 19 : 17, radius * 1.2),
        ) * pixelRatio;
      text = getDelayText(trajectory, viewState, delay, cancelled);
    }

    // Draw colored circle with black border
    const circle = getCircleCanvas(
      radius,
      circleFillColor,
      hasStroke,
      hasDash,
      pixelRatio,
    );

    // Draw text in the center of circle
    let circleText: AnyCanvas | null = null;
    if (isDisplayText && circle) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const image = getImage(trajectory, viewState, name, radius);
      if (image) {
        // If an image is provided we use it instead of text
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        circleText = image;
      } else {
        const fontSize2 = Math.max(radius, 10);
        const textSize = getTextSize(
          trajectory,
          viewState,
          circle.getContext('2d') as AnyCanvasContext,
          radius * 2,
          name,
          fontSize2,
          getTextFont(trajectory, viewState, fontSize2, name),
        );

        const font = getTextFont(trajectory, viewState, textSize, name);
        const hasStroke2 =
          !!useDelayStyle &&
          delay === null &&
          operatorProvidesRealtime === 'yes';

        circleText = getTextCanvas(
          name,
          radius,
          textSize,
          textColor,
          circleFillColor,
          hasStroke2,
          pixelRatio,
          font,
        );
      }
    }

    // Draw circle delay background
    let delayBg = null;
    if (hasDelayBg) {
      delayBg = getDelayBgCanvas(
        radius,
        getDelayColor(trajectory, viewState, delay, cancelled),
        pixelRatio,
      );
    }

    // Draw delay text
    let delayText = null;
    if (text) {
      delayText = getDelayTextCanvas(
        text,
        fontSize,
        getDelayFont(trajectory, viewState, fontSize, text),
        getDelayColor(trajectory, viewState, delay, cancelled, true),
        delayOutlineColor,
        pixelRatio,
      );
    }

    // Draw rotated arrow and add the circle in it
    let isArrowOnDelaySide = true;
    let bufferArrow = null;
    const canvasRef = delayBg ?? circle;
    if (hasHeading && canvasRef && circle) {
      const radianAdjusted = rotation % (2 * Math.PI);
      if (-0.5 > radianAdjusted || radianAdjusted > 0.5) {
        isArrowOnDelaySide = false;
      }

      bufferArrow = getBufferArrowCanvas(
        canvasRef.width,
        canvasRef.height,
        circleFillColor,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
        getArrowSize(trajectory, viewState, radius / pixelRatio),
        rotation,
        pixelRatio,
      );
    }

    // At this point we have the canvases to compose the final canvas.
    // Create the canvas using the biggest width between all the elements
    const biggestCircleWidthWithoutArrow = Math.max(
      delayBg?.width ?? 0,
      circle?.width ?? 0,
    );
    const biggestCircleWidth = Math.max(
      bufferArrow?.width ?? 0,
      delayBg?.width ?? 0,
      circle?.width ?? 0,
    );
    const width = biggestCircleWidth + (delayText?.width ?? 0) * 2;
    const height =
      bufferArrow?.height ?? delayBg?.height ?? circle?.height ?? 0;
    const canvas = createCanvas(width, height);
    if (canvas) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      if (!ctx) {
        return null;
      }

      if (bufferArrow) {
        // Draw in the middle of the canvas
        ctx?.drawImage(
          bufferArrow,
          canvas.width / 2 - bufferArrow.width / 2,
          canvas.height / 2 - bufferArrow.height / 2,
        );
      }

      if (delayBg) {
        // Draw in the middle of the canvas
        ctx.drawImage(
          delayBg,
          canvas.width / 2 - delayBg.width / 2,
          canvas.height / 2 - delayBg.height / 2,
        );
      }

      if (circle) {
        // Draw in the middle of the canvas
        ctx.drawImage(
          circle,
          canvas.width / 2 - circle.width / 2,
          canvas.height / 2 - circle.height / 2,
        );
      }

      // Draw text in the circle
      if (circleText) {
        // Draw in the middle of the canvas
        ctx.drawImage(
          circleText,
          canvas.width / 2 - circleText.width / 2,
          canvas.height / 2 - circleText.height / 2,
        );
      }

      // Draw delay text
      if (delayText) {
        ctx.drawImage(
          delayText,
          canvas.width / 2 +
            (isArrowOnDelaySide
              ? biggestCircleWidth
              : biggestCircleWidthWithoutArrow) /
              2,
          canvas.height / 2 - delayText.height / 2,
        );
      }

      cache[key] = canvas;
    }
  }

  return cache[key];
};
export default realtimeDefaultStyle;
