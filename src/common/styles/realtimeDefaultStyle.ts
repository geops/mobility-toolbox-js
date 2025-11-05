import createCanvas from '../utils/createCanvas';

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

const ARROW_WIDTH = 16;
const getArrowCanvas = (
  fillColor: string,
  pixelRatio = 1,
): AnyCanvas | null => {
  const key = `${fillColor},${pixelRatio}`;
  if (!arrowCache[key]) {
    // Create the arrow canvas
    const padding = 2 * pixelRatio;
    const canvas = createCanvas(ARROW_WIDTH * pixelRatio, 20 * pixelRatio);
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
  rotation = 0,
  pixelRatio = 1,
  margin = 0,
): AnyCanvas | null => {
  const bufferKey = `${fillColor},${width},${height},${rotation},${pixelRatio},${margin}`;
  if (!bufferArrowCache[bufferKey]) {
    // Create a buffer canvas around the current vehicle to display properly the arrow
    const arrowCanvas = getArrowCanvas(fillColor, pixelRatio);
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
  getTextFont: (fontSize: number, text?: string) => string,
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
        ctx.font = getTextFont(textSize + 2, text);
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(text, radius, radius);
        ctx.restore();
      }

      // Draw a text
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = fillColor;
      ctx.font = getTextFont(textSize, text);
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
    getBgColor = () => {
      return '#000';
    },
    getDelayColor = () => {
      return '#000';
    },
    getDelayFont = (fontSize: number) => {
      return `bold ${fontSize}px arial, sans-serif`;
    },
    getDelayText = () => {
      return null;
    },
    getMaxRadiusForStrokeAndDelay = () => {
      return 7;
    },
    getMaxRadiusForText = () => {
      return 10;
    },
    getRadius = () => {
      return 0;
    },
    getText = (text?: string) => {
      return text;
    },
    getTextColor = () => {
      return '#000';
    },
    getTextFont = (fontSize: number) => {
      return `bold ${fontSize}px arial, sans-serif`;
    },
    getTextSize = () => {
      return 14;
    },
    hoverVehicleId,
    selectedVehicleId,
    useDelayStyle,
    useHeadingStyle,
  } = options;

  const { pixelRatio = 1, zoom } = viewState;
  let { type } = trajectory.properties;
  const {
    delay,
    line,
    operator_provides_realtime_journey: operatorProvidesRealtime,
    rotation,
    state,
    train_id: id,
  } = trajectory.properties;
  let { color, name, text_color: textColor } = line || {};

  name = getText(name);

  const cancelled = state === 'JOURNEY_CANCELLED';

  if (!type) {
    type = 'rail';
  }

  if (!name) {
    name = 'I';
  }

  if (color && !color.startsWith('#')) {
    color = `#${color}`;
  }

  if (textColor && !textColor.startsWith('#')) {
    textColor = `#${textColor}`;
  }

  const z = Math.min(Math.floor(zoom || 1), 16);
  const hover = !!(hoverVehicleId && hoverVehicleId === id);
  const selected = !!(selectedVehicleId && selectedVehicleId === id);

  // Calcul the radius of the circle
  let radius = getRadius(type, z) * pixelRatio;
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
    color = color || getBgColor(type, line);
    key += `${color}`;

    if (isDisplayStrokeAndDelay) {
      key += `${cancelled}${delay}`;
    }
  }

  if (isDisplayText) {
    // Get the text color of the vehicle
    if (useDelayStyle) {
      textColor = '#000000';
    } else {
      textColor = textColor || getTextColor(type, line);
    }

    key += `${name}${textColor}`;
  }

  if (!cache[key]) {
    if (radius === 0) {
      return null;
    }

    // Get the color of the vehicle
    let circleFillColor = color || '#fff';
    if (useDelayStyle) {
      circleFillColor = getDelayColor(delay, cancelled);
    }

    const hasStroke = isDisplayStrokeAndDelay || hover || selected;

    const hasDash =
      !!isDisplayStrokeAndDelay &&
      !!useDelayStyle &&
      delay === null &&
      operatorProvidesRealtime === 'yes';

    const isDisplayDelayText =
      isDisplayStrokeAndDelay &&
      (hover || (delay || 0) >= delayDisplay || cancelled);

    // Show delay if feature is hovered or if delay is above 5mins
    let fontSize = 0;
    let text = null;
    if (isDisplayDelayText) {
      // Draw delay text
      fontSize =
        Math.max(
          cancelled ? 19 : 14,
          Math.min(cancelled ? 19 : 17, radius * 1.2),
        ) * pixelRatio;
      text = getDelayText(delay, cancelled);
    }

    // Draw colored circle with black border
    let circle = getCircleCanvas(
      radius,
      circleFillColor,
      hasStroke,
      hasDash,
      pixelRatio,
    );

    // Draw circle delay background
    let delayBg = null;
    if (isDisplayStrokeAndDelay && delay !== null) {
      delayBg = getDelayBgCanvas(
        radius,
        getDelayColor(delay, cancelled),
        pixelRatio,
      );
    }

    // Draw delay text
    let delayText = null;
    if (text) {
      delayText = getDelayTextCanvas(
        text,
        fontSize,
        getDelayFont(fontSize, text),
        getDelayColor(delay, cancelled, true),
        delayOutlineColor,
        pixelRatio,
      );
    }

    // Draw rotated arrow and add the circle in it
    let isArrowOnDelaySide = true;

    if (useHeadingStyle && rotation && circle) {
      const radianAdjusted = rotation % (2 * Math.PI);
      if (-0.5 > radianAdjusted || radianAdjusted > 0.5) {
        isArrowOnDelaySide = false;
      }

      const bufferArrow = getBufferArrowCanvas(
        circle.width,
        circle.height,
        circleFillColor,
        rotation,
        pixelRatio,
      );

      if (bufferArrow) {
        const vehicleWithArrow = createCanvas(
          bufferArrow.width,
          bufferArrow.height,
        );
        const context: AnyCanvasContext = vehicleWithArrow?.getContext(
          '2d',
        ) as AnyCanvasContext;
        context?.drawImage(
          bufferArrow,
          0,
          0,
          bufferArrow.width,
          bufferArrow.height,
        );
        context?.drawImage(
          circle,
          bufferArrow.width / 2 - circle.width / 2,
          bufferArrow.height / 2 - circle.height / 2,
          circle.width,
          circle.height,
        );
        circle = vehicleWithArrow;
      }
    }

    // Create the canvas
    const width = (circle?.width ?? 0) + (delayText?.width ?? 0) * 2;
    const height = circle?.height ?? 0;
    const canvas = createCanvas(width, height);
    if (canvas) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      if (!ctx) {
        return null;
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
      let circleText = null;
      if (isDisplayText) {
        const fontSize2 = Math.max(radius, 10);
        const textSize = getTextSize(
          ctx,
          radius * 2,
          name,
          fontSize2,
          getTextFont,
        );
        const hasStroke2 =
          !!useDelayStyle &&
          delay === null &&
          operatorProvidesRealtime === 'yes';

        circleText = getTextCanvas(
          name,
          radius,
          textSize,
          textColor || '#000',
          circleFillColor,
          hasStroke2,
          pixelRatio,
          getTextFont,
        );
      }

      if (circleText) {
        ctx.drawImage(
          circleText,
          canvas.width / 2 - circleText.width / 2,
          canvas.height / 2 - circleText.height / 2,
        );
      }

      if (delayText && circle?.width) {
        ctx.drawImage(
          delayText,
          canvas.width / 2 +
            (isArrowOnDelaySide
              ? circle.width
              : (delayBg?.width ?? circle.width)) /
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
