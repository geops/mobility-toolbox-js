import createCanvas from '../utils/createCanvas';

// Draw circle delay background
const cacheDelayBg = {};
export const getDelayBgCanvas = (origin, radius, color) => {
  const key = `${origin}, ${radius}, ${color}`;
  if (!cacheDelayBg[key]) {
    const canvas = createCanvas(origin * 2, origin * 2);
    if (canvas) {
      const ctx = canvas.getContext('2d');
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

// Draw delay text
const cacheDelayText = {};
export const getDelayTextCanvas = (
  width,
  text,
  fontSize,
  font,
  delayColor,
  delayOutlineColor = '#000',
  pixelRatio = 1,
) => {
  const key = `${width}, ${text}, ${font}, ${delayColor}, ${delayOutlineColor}, ${pixelRatio}`;
  if (!cacheDelayText[key]) {
    const canvas = createCanvas(width, fontSize + 8 * pixelRatio);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = font;
      ctx.fillStyle = delayColor;
      ctx.strokeStyle = delayOutlineColor;
      ctx.lineWidth = 1.5 * pixelRatio;
      const delayText = text;
      ctx.strokeText(delayText, 0, fontSize);
      ctx.fillText(delayText, 0, fontSize);
      cacheDelayText[key] = canvas;
    }
  }
  return cacheDelayText[key];
};

// Draw colored circle with black border
const cacheCircle = {};
export const getCircleCanvas = (
  origin,
  radius,
  color,
  hasStroke,
  hasDash,
  pixelRatio,
) => {
  const key = `${origin}, ${radius}, ${color}, ${hasStroke},  ${hasDash}, ${pixelRatio}`;
  if (!cacheCircle[key]) {
    const canvas = createCanvas(origin * 2, origin * 2);
    if (canvas) {
      const ctx = canvas.getContext('2d');
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

// Draw text in the circle
const cacheText = {};
export const getTextCanvas = (
  text,
  origin,
  textSize,
  fillColor,
  strokeColor,
  hasStroke,
  pixelRatio,
) => {
  const key = `${text}, ${origin}, ${textSize}, ${fillColor},${strokeColor}, ${hasStroke}, ${pixelRatio}`;
  if (!cacheText[key]) {
    const canvas = createCanvas(origin * 2, origin * 2);
    if (canvas) {
      const ctx = canvas.getContext('2d');

      // Draw a stroke to the text only if a provider provides realtime but we don't use it.
      if (hasStroke) {
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `bold ${textSize + 2}px Arial`;
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(text, origin, origin);
        ctx.restore();
      }

      // Draw a text
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = fillColor;
      ctx.font = `bold ${textSize}px Arial`;
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(text, origin, origin);
      ctx.fillText(text, origin, origin);

      cacheText[key] = canvas;
    }
  }
  return cacheText[key];
};

/**
 * A tracker style that take in account the delay.
 *
 * @param {*} trajectory The trajectory to render.
 * @param {*} viewState The view state of the map.
 * @param {*} options Some options to change the rendering
 * @return a canvas
 */
const styleCache = {};

window.setInterval(() => {
  console.log(Object.keys(styleCache).length);
}, 3000);
const style = (trajectory, viewState, options) => {
  const {
    hoverVehicleId,
    selectedVehicleId,
    useDelayStyle,
    delayOutlineColor = '#000',
    delayDisplay = 300000,
    getRadius,
    getBgColor,
    getDelayColor,
    getDelayText,
    getTextColor,
    getTextSize,
  } = options;

  const { zoom, pixelRatio } = viewState;
  let { type, cancelled } = trajectory.properties;
  const {
    train_id: id,
    line,
    delay,
    state,
    operator_provides_realtime_journey: operatorProvidesRealtime,
  } = trajectory.properties;
  let { name, text_color: textColor, color } = line || {};

  // In the future, the cancelled property will be removed we still managed it
  // until the backend change is on prod.
  cancelled = cancelled === true || state === 'JOURNEY_CANCELLED';

  if (!type) {
    type = 'Rail';
  }

  if (!name) {
    name = 'I';
  }

  if (!textColor) {
    textColor = '#000000';
  }

  if (color && color[0] !== '#') {
    color = `#${color}`;
  }

  if (textColor[0] !== '#') {
    textColor = `#${textColor}`;
  }

  const z = Math.min(Math.floor(zoom || 1), 16);
  const hover = hoverVehicleId && hoverVehicleId === id;
  const selected = selectedVehicleId && selectedVehicleId === id;

  // Calcul the radius of the circle
  let radius = getRadius(type, z) * pixelRatio;
  const isDisplayStrokeAndDelay = radius >= 7 * pixelRatio;

  if (hover || selected) {
    radius = isDisplayStrokeAndDelay
      ? radius + 5 * pixelRatio
      : 14 * pixelRatio;
  }
  const mustDrawText = radius > 10 * pixelRatio;

  // Optimize the cache key, very important in high zoom level
  let key = `${radius}${hover}${selected}${cancelled}${delay}`;

  if (useDelayStyle) {
    key += `${operatorProvidesRealtime}`;
  } else {
    key += `${type}${color}`;
  }

  if (mustDrawText) {
    key += `${name}${textColor}`;
  }

  if (!styleCache[key]) {
    if (radius === 0) {
      styleCache[key] = null;
      return null;
    }

    const margin = 1 * pixelRatio;
    const radiusDelay = radius + 2;
    const markerSize = radius * 2;
    const size = radiusDelay * 2 + margin * 2 + 100 * pixelRatio; // add space for delay information
    const origin = size / 2;

    // Create the canvas
    const canvas = createCanvas(size, size);
    if (canvas) {
      const ctx = canvas.getContext('2d');

      if (isDisplayStrokeAndDelay && delay !== null) {
        // Draw circle delay background
        const delayBg = getDelayBgCanvas(
          origin,
          radiusDelay,
          getDelayColor(delay, cancelled),
        );
        ctx.drawImage(delayBg, 0, 0);
      }

      // Show delay if feature is hovered or if delay is above 5mins.
      if (
        isDisplayStrokeAndDelay &&
        (hover || delay >= delayDisplay || cancelled)
      ) {
        // Draw delay text
        const fontSize =
          Math.max(
            cancelled ? 19 : 14,
            Math.min(cancelled ? 19 : 17, radius * 1.2),
          ) * pixelRatio;
        const text = getDelayText(delay, cancelled);

        if (text) {
          const textWidth = text.length * fontSize;
          const delayText = getDelayTextCanvas(
            textWidth,
            text,
            fontSize,
            `bold ${fontSize}px arial, sans-serif`,
            getDelayColor(delay, cancelled, true),
            delayOutlineColor,
            pixelRatio,
          );
          ctx.drawImage(
            delayText,
            origin + radiusDelay + margin,
            origin - fontSize,
          );
        }
      }

      // Draw colored circle with black border
      let circleFillColor;
      if (useDelayStyle) {
        circleFillColor = getDelayColor(delay, cancelled);
      } else {
        circleFillColor = color || getBgColor(type);
      }

      const hasStroke = isDisplayStrokeAndDelay || hover || selected;

      const hasDash =
        isDisplayStrokeAndDelay &&
        useDelayStyle &&
        delay === null &&
        operatorProvidesRealtime === 'yes';

      const circle = getCircleCanvas(
        origin,
        radius,
        circleFillColor,
        hasStroke,
        hasDash,
        pixelRatio,
      );

      ctx.drawImage(circle, 0, 0);

      // Draw text in the circle
      if (mustDrawText) {
        const fontSize = Math.max(radius, 10);
        const textSize = getTextSize(ctx, markerSize, name, fontSize);
        const textColor2 = !useDelayStyle
          ? textColor || getTextColor(type)
          : '#000000';
        const hasStroke2 =
          useDelayStyle && delay === null && operatorProvidesRealtime === 'yes';

        const text = getTextCanvas(
          name,
          origin,
          textSize,
          textColor2,
          circleFillColor,
          hasStroke2,
          pixelRatio,
        );

        ctx.drawImage(text, 0, 0);
      }

      styleCache[key] = canvas;
    }
  }

  return styleCache[key];
};
export default style;
