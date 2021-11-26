import {
  getRadius,
  getBgColor,
  getDelayColor,
  getDelayText,
  getTextColor,
  getTextSize,
} from '../trackerConfig';

const styleCache = {};

const style = (trajectory, viewState, trackerLayer) => {
  const {
    hoverVehicleId,
    selectedVehicleId,
    useDelayStyle,
    delayOutlineColor,
    delayDisplay,
  } = trackerLayer;

  const {
    zoom,
    pixelRatio,
    operator_provides_realtime_journey: operatorProvidesRealtime,
  } = viewState;
  let { line, type } = trajectory;
  const { id, delay, cancelled = false } = trajectory;

  if (!type) {
    type = 'Rail';
  }

  if (!line) {
    line = {};
  }

  let { name, text_color: textColor, color } = line;

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
  const hover = hoverVehicleId === id;
  const selected = selectedVehicleId === id;

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
  let key = `${z}${type}${color}${hover}${selected}${cancelled}${delay}`;

  if (useDelayStyle) {
    key += `${operatorProvidesRealtime}`;
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

    const canvas = document.createElement('canvas');
    // add space for delay information
    canvas.width = radiusDelay * 2 + margin * 2 + 100 * pixelRatio;
    canvas.height = radiusDelay * 2 + margin * 2 + 100 * pixelRatio;
    const ctx = canvas.getContext('2d');
    const origin = canvas.width / 2;

    if (isDisplayStrokeAndDelay && delay !== null) {
      // Draw circle delay background
      ctx.save();
      ctx.beginPath();
      ctx.arc(origin, origin, radiusDelay, 0, 2 * Math.PI, false);
      ctx.fillStyle = getDelayColor(delay, cancelled);
      ctx.filter = 'blur(1px)';
      ctx.fill();
      ctx.restore();
    }

    // Show delay if feature is hovered or if delay is above 5mins.
    if (
      isDisplayStrokeAndDelay &&
      (hover || delay >= delayDisplay || cancelled)
    ) {
      // Draw delay text
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(
        cancelled ? 19 : 14,
        Math.min(cancelled ? 19 : 17, radius * 1.2),
      )}px arial, sans-serif`;
      ctx.fillStyle = getDelayColor(delay, cancelled, true);

      ctx.strokeStyle = delayOutlineColor;
      ctx.lineWidth = 1.5 * pixelRatio;
      const delayText = getDelayText(delay, cancelled);
      ctx.strokeText(delayText, origin + radiusDelay + margin, origin);
      ctx.fillText(delayText, origin + radiusDelay + margin, origin);
      ctx.restore();
    }

    // Draw colored circle with black border
    let circleFillColor;
    if (useDelayStyle) {
      circleFillColor = getDelayColor(delay, cancelled);
    } else {
      circleFillColor = color || getBgColor(type);
    }

    ctx.save();
    if (isDisplayStrokeAndDelay || hover || selected) {
      ctx.lineWidth = 1 * pixelRatio;
      ctx.strokeStyle = '#000000';
    }
    ctx.fillStyle = circleFillColor;
    ctx.beginPath();
    ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    // Dashed outline if a provider provides realtime but we don't use it.
    if (
      isDisplayStrokeAndDelay &&
      useDelayStyle &&
      delay === null &&
      operatorProvidesRealtime === 'yes'
    ) {
      ctx.setLineDash([5, 3]);
    }
    if (isDisplayStrokeAndDelay || hover || selected) {
      ctx.stroke();
    }
    ctx.restore();

    // Draw text in the circle
    if (mustDrawText) {
      const fontSize = Math.max(radius, 10 * pixelRatio);
      const textSize = getTextSize(ctx, markerSize, name, fontSize);

      // Draw a stroke to the text only if a provider provides realtime but we don't use it.
      if (
        useDelayStyle &&
        delay === null &&
        operatorProvidesRealtime === 'yes'
      ) {
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `bold ${textSize + 2}px Arial`;
        ctx.strokeStyle = circleFillColor;
        ctx.strokeText(name, origin, origin);
        ctx.restore();
      }

      // Draw a text
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = !useDelayStyle
        ? textColor || getTextColor(type)
        : '#000000';
      ctx.font = `bold ${textSize}px Arial`;
      ctx.strokeStyle = circleFillColor;
      ctx.strokeText(name, origin, origin);
      ctx.fillText(name, origin, origin);
      ctx.restore();
    }

    styleCache[key] = canvas;
  }

  return styleCache[key];
};
export default style;
