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

const getArrowCanvas = (fillColor: string): AnyCanvas | null => {
  const key = `${fillColor}`;
  if (!arrowCache[key]) {
    // Create the arrow canvas
    const arrowCanvas = createCanvas(10, 14);
    const ctx = arrowCanvas?.getContext('2d') as AnyCanvasContext;
    if (ctx) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(7, 7);
      ctx.lineTo(2, 12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(7, 7);
      ctx.lineTo(2, 12);
      ctx.lineTo(2, 2);
      ctx.stroke();
    }
    arrowCache[key] = arrowCanvas;
  }

  return arrowCache[key];
};

const bufferArrowCache: Record<string, AnyCanvas | null> = {};

const ARROW_MARGIN = 5;
const getBufferArrowCanvas = (
  canvas: AnyCanvas,
  fillColor: string,
  rotation = 0,
): AnyCanvas | null => {
  const margin = ARROW_MARGIN;
  const bufferKey = `${fillColor},${canvas.width},${canvas.height},${rotation}`;
  if (!bufferArrowCache[bufferKey]) {
    // Create a buffer canvas around the current vehicle to display properly the arrow
    const arrowCanvas = getArrowCanvas(fillColor);
    const buffer = createCanvas(
      canvas.width + margin * 2,
      canvas.height + margin * 2,
    );
    if (arrowCanvas && buffer) {
      const bufferCtx = buffer.getContext('2d') as AnyCanvasContext;

      const rot = rotation; // + (90 * Math.PI) / 180;
      rotateCanvas(buffer, -rot);

      bufferCtx?.drawImage(
        arrowCanvas,
        buffer.width - arrowCanvas.width,
        buffer.height / 2 - arrowCanvas.height / 2,
        arrowCanvas.width,
        arrowCanvas.height,
      );
    }

    bufferArrowCache[bufferKey] = buffer;
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
  origin: number,
  radius: number,
  color: string,
) => {
  const key = `${origin}, ${radius}, ${color}`;
  if (!cacheDelayBg[key]) {
    const canvas = createCanvas(origin * 2, origin * 2);
    if (canvas) {
      const ctx = canvas.getContext('2d') as AnyCanvasContext;
      if (!ctx) {
        return null;
      }
      ctx.beginPath();
      ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.filter = 'blur(1px)';
      ctx.fill();
      cacheDelayBg[key] = canvas;
    }
  }
  return cacheDelayBg[key];
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
  delayColor: string,
  delayOutlineColor = '#000',
  pixelRatio = 1,
) => {
  const key = `${text}, ${font}, ${delayColor}, ${delayOutlineColor}, ${pixelRatio}`;
  if (!cacheDelayText[key]) {
    const canvas = createCanvas(
      Math.ceil(text.length * fontSize),
      Math.ceil(fontSize + 8 * pixelRatio),
    );
    if (canvas) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      if (!ctx) {
        return null;
      }
      ctx.font = font;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = font;
      ctx.fillStyle = delayColor;
      ctx.strokeStyle = delayOutlineColor;
      ctx.lineWidth = 1.5 * pixelRatio;
      ctx.strokeText(text, 0, fontSize);
      ctx.fillText(text, 0, fontSize);
      cacheDelayText[key] = canvas;
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
  origin: number,
  radius: number,
  color: string,
  hasStroke: boolean,
  hasDash: boolean,
  pixelRatio: number,
) => {
  const key = `${origin}, ${radius}, ${color}, ${hasStroke},  ${hasDash}, ${pixelRatio}`;
  if (!cacheCircle[key]) {
    const canvas = createCanvas(origin * 2, origin * 2);
    if (canvas) {
      const ctx = canvas.getContext('2d') as AnyCanvasContext;
      if (!ctx) {
        return null;
      }
      ctx.fillStyle = color;

      if (hasStroke) {
        ctx.lineWidth = 1 * pixelRatio;
        ctx.strokeStyle = '#000000';
      }

      ctx.beginPath();
      ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
      ctx.fill();

      if (hasDash) {
        ctx.setLineDash([5, 3]);
      }

      if (hasStroke) {
        ctx.stroke();
      }

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
  origin: number,
  textSize: number,
  fillColor: string,
  strokeColor: string,
  hasStroke: boolean,
  pixelRatio: number,
  getTextFont: (fontSize: number, text?: string) => string,
) => {
  const key = `${text}, ${origin}, ${textSize}, ${fillColor},${strokeColor}, ${hasStroke}, ${pixelRatio}`;
  if (!cacheText[key]) {
    const canvas = createCanvas(origin * 2, origin * 2);
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
        ctx.strokeText(text, origin, origin);
        ctx.restore();
      }

      // Draw a text
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = fillColor;
      ctx.font = getTextFont(textSize, text);
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(text, origin, origin);
      ctx.fillText(text, origin, origin);

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

    const margin = 5 * pixelRatio;
    const radiusDelay = radius + 2 * pixelRatio;
    const markerSize = radius * 2;
    const size = radiusDelay * 2 + margin * 2;
    const origin = size / 2;

    // Draw circle delay background
    let delayBg = null;
    if (isDisplayStrokeAndDelay && delay !== null) {
      delayBg = getDelayBgCanvas(
        origin,
        radiusDelay,
        getDelayColor(delay, cancelled),
      );
    }

    // Show delay if feature is hovered or if delay is above 5mins.
    let delayText = null;
    let fontSize = 0;
    if (
      isDisplayStrokeAndDelay &&
      (hover || (delay || 0) >= delayDisplay || cancelled)
    ) {
      // Draw delay text
      fontSize =
        Math.max(
          cancelled ? 19 : 14,
          Math.min(cancelled ? 19 : 17, radius * 1.2),
        ) * pixelRatio;
      const text = getDelayText(delay, cancelled);

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
    }

    const hasStroke = isDisplayStrokeAndDelay || hover || selected;

    const hasDash =
      !!isDisplayStrokeAndDelay &&
      !!useDelayStyle &&
      delay === null &&
      operatorProvidesRealtime === 'yes';

    // Get the color of the vehicle
    let circleFillColor = color || '#fff';
    if (useDelayStyle) {
      circleFillColor = getDelayColor(delay, cancelled);
    }

    let circle = getCircleCanvas(
      origin,
      radius,
      circleFillColor,
      hasStroke,
      hasDash,
      pixelRatio,
    );

    let arrowMargin = 0;
    let arrowUnderDelayTextMargin = 0;

    if (useHeadingStyle && rotation && circle) {
      arrowMargin = ARROW_MARGIN;
      const radianAdjusted = rotation % (2 * Math.PI);
      if (-1 > radianAdjusted || radianAdjusted > 1) {
        arrowUnderDelayTextMargin = arrowMargin;
      }

      const bufferArrow = getBufferArrowCanvas(
        circle,
        circleFillColor,
        rotation,
      );

      if (bufferArrow) {
        const bufferSize = (bufferArrow.width - circle.width) / 2;
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
          bufferSize,
          bufferSize,
          circle.width,
          circle.height,
        );
        circle = vehicleWithArrow;
      }
    }

    // Create the canvas
    const width = (circle?.width || size) + (delayText?.width || 0) * 2;
    const height = circle?.height || size;
    const canvas = createCanvas(width, height);
    if (canvas) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      if (!ctx) {
        return null;
      }

      // The renderTrajectories will center the image on the vehicle positions.
      const originX = 0 + (delayText?.width || 0);
      const originY = 0;

      if (delayBg) {
        ctx.drawImage(delayBg, arrowMargin + originX, arrowMargin + originY);
      }

      if (circle) {
        ctx.drawImage(circle, originX, originY);
      }

      // Draw text in the circle
      let circleText = null;
      if (isDisplayText) {
        const fontSize2 = Math.max(radius, 10);
        const textSize = getTextSize(
          ctx,
          markerSize,
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
          origin + arrowMargin,
          textSize,
          textColor || '#000',
          circleFillColor,
          hasStroke2,
          pixelRatio,
          getTextFont,
        );
      }

      if (circleText) {
        ctx.drawImage(circleText, originX, 0);
      }

      if (delayText && circle?.width) {
        ctx.drawImage(
          delayText,
          canvas.width / 2 + circle.width / 2 - arrowUnderDelayTextMargin,
          Math.ceil(origin - fontSize) + arrowMargin,
        );
      }

      cache[key] = canvas;
    }
  }

  return cache[key];
};
export default realtimeDefaultStyle;
