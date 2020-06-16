import s1Circle from '../../assets/images/lines/s1kreis.url.svg';
import s2Circle from '../../assets/images/lines/s2kreis.url.svg';
import s3Circle from '../../assets/images/lines/s3kreis.url.svg';
import s4Circle from '../../assets/images/lines/s4kreis.url.svg';
import s6Circle from '../../assets/images/lines/s6kreis.url.svg';
import s7Circle from '../../assets/images/lines/s7kreis.url.svg';
import s8Circle from '../../assets/images/lines/s8kreis.url.svg';
import s20Circle from '../../assets/images/lines/s20kreis.url.svg';

import s1Arrow from '../../assets/images/lines/s1pfeil.url.svg';
import s2Arrow from '../../assets/images/lines/s2pfeil.url.svg';
import s3Arrow from '../../assets/images/lines/s3pfeil.url.svg';
import s4Arrow from '../../assets/images/lines/s4pfeil.url.svg';
import s6Arrow from '../../assets/images/lines/s6pfeil.url.svg';
import s7Arrow from '../../assets/images/lines/s7pfeil.url.svg';
import s8Arrow from '../../assets/images/lines/s8pfeil.url.svg';
import s20Arrow from '../../assets/images/lines/s20pfeil.url.svg';

import imgUnknown from '../../assets/images/lines/unknown.url.svg';

/**
 * @private
 */
const rotateCanvas = (canvas, rotation) => {
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotation);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
};

/**
 * @private
 */
const getImageScaled = (image, scale) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  [canvas.width, canvas.height] = [image.width * scale, image.height * scale];
  ctx.scale(scale, scale);
  ctx.drawImage(image, 0, 0);
  return canvas;
};

/**
 * @private
 */
const getImageArrowRotated = (image, imageArrow, rotation) => {
  const rot = rotation + (90 * Math.PI) / 180;
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [image.width, image.height];
  const ctx = canvas.getContext('2d');
  ctx.save();
  rotateCanvas(canvas, -rot);
  ctx.drawImage(imageArrow, 0, 0);
  ctx.restore();
  ctx.drawImage(image, 0, 0);
  return canvas;
};

/**
 * @private
 */
const canvasCache = {};

/**
 * Cache for line styles.
 * @type {Object.<ol.style.Style}}
 * @private
 */
const lineImages = {
  S1: {
    circle: s1Circle,
    arrow: s1Arrow,
  },
  S2: {
    circle: s2Circle,
    arrow: s2Arrow,
  },
  S3: {
    circle: s3Circle,
    arrow: s3Arrow,
  },
  S4: {
    circle: s4Circle,
    arrow: s4Arrow,
  },
  S6: {
    circle: s6Circle,
    arrow: s6Arrow,
  },
  S7: {
    circle: s7Circle,
    arrow: s7Arrow,
  },
  S8: {
    circle: s8Circle,
    arrow: s8Arrow,
  },
  S20: {
    circle: s20Circle,
    arrow: s20Arrow,
  },
};

Object.keys(lineImages).forEach((k) => {
  Object.keys(lineImages[k]).forEach((img) => {
    const loadedImage = new Image();
    loadedImage.src = lineImages[k][img];
    // very important to avoid errors in the console, must be the
    // exact same size as in the svg files(for firefox).
    loadedImage.width = 150;
    loadedImage.height = 150;
    lineImages[k][img] = loadedImage;
  });
});

const unknownImage = new Image();
unknownImage.src = imgUnknown;
// very important to avoid errors in the console, must be the
// exact same size as in the svg files(for firefox).
unknownImage.width = 150;
unknownImage.height = 150;
lineImages.null = { circle: unknownImage };
lineImages[undefined] = { circle: unknownImage };

/**
 * Return the canvas for the line style consisting of an arrow
 * pointing in the given direction and a line number.
 * @private
 */
export default (line, rotation, scale) => {
  const approxRotation = parseFloat(rotation.toFixed(1));
  const key = [line, approxRotation, scale].join('-');
  if (!canvasCache[key]) {
    const { circle, arrow } = lineImages[line];
    let canvas = circle;

    // We add the arrow to the canvas
    if (arrow) {
      canvas = getImageArrowRotated(canvas, arrow, approxRotation);
    }

    // We scale the canvas
    if (scale && scale !== 1) {
      canvas = getImageScaled(canvas, scale);
    }

    canvasCache[key] = canvas;
  }

  return canvasCache[key];
};
