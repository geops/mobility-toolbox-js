const cacheDelayBg = {};

// Draw circle delay background
export const getDelayBgCanvas = (origin, radius, color) => {
  const key = `${origin}, ${radius}, ${color}`;
  if (!cacheDelayBg[key]) {
    // console.log('cacheDelayBg');
    const canvas = new OffscreenCanvas(origin * 2, origin * 2);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.filter = 'blur(1px)';
    ctx.fill();
    cacheDelayBg[key] = canvas;
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
  delayOutlineColor,
  pixelRatio,
) => {
  const key = `${width}, ${text}, ${font}, ${delayColor}, ${delayOutlineColor}, ${pixelRatio}`;
  if (!cacheDelayText[key]) {
    const canvas = new OffscreenCanvas(width, fontSize + 8);
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
    // console.log('cacheDelayBg');
    const canvas = new OffscreenCanvas(origin * 2, origin * 2);
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
    const canvas = new OffscreenCanvas(origin * 2, origin * 2);
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
  return cacheText[key];
};

export default {
  getDelayBgCanvas,
  getDelayTextCanvas,
  getCircleCanvas,
  getTextCanvas,
};
