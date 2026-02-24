import {
  type AnyCanvas,
  type AnyCanvasContext,
  type RealtimeStyleFunction,
  type RealtimeStyleOptions,
  type RealtimeTrajectory,
  type StyleCache,
  type ViewState,
} from '../../types';
import createCanvas from '../utils/createCanvas';

import {
  getBufferArrowCanvas,
  getCircleCanvas,
  getDelayBgCanvas,
  getDelayTextCanvas,
  getTextCanvas,
} from './realtimeDrawCanvasUtils';

const cache: StyleCache = {};

/**
 * A realtime style that display a circle, a delay (halo and text) and an arrow (heading).
 * The colors (texts and circle) can be defined in the options.
 *
 * @param {RealtimeTrajectory} trajectory The trajectory to render.
 * @param {ViewState} viewState The view state of the map.
 * @param {RealtimeStyleOptions} options Some options to change the rendering
 * @return a canvas
 */
const realtimeStyle: RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => {
  const {
    delayDisplay,
    delayOutlineColor,
    getArrowSize,
    getColor,
    getDelayColor,
    getDelayFont,
    getDelayText,
    getDelayTextColor,
    getImage,
    getMaxRadiusForStrokeAndDelay,
    getMaxRadiusForText,
    getRadius,
    getText,
    getTextColor,
    getTextFont,
    getTextSize,
    hoverVehicleId,
    selectedVehicleId,
    showDelayBg,
    showDelayText,
    showHeading,
    useDelayStyle,
  } = options;

  const { pixelRatio = 1 } = viewState;
  const {
    delay,
    operator_provides_realtime_journey: operatorProvidesRealtime,
    rotation,
    state,
    train_id: id,
  } = trajectory.properties;

  const name = getText?.(trajectory, viewState) || '';

  let color = getColor(trajectory, viewState);
  let textColor = getTextColor(trajectory, viewState);
  const cancelled = state === 'JOURNEY_CANCELLED';
  const hover = !!(hoverVehicleId && hoverVehicleId === id);
  const selected = !!(selectedVehicleId && selectedVehicleId === id);

  // Get the text color of the vehicle
  if (useDelayStyle) {
    color = getDelayColor(trajectory, viewState, delay, cancelled);
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
  let key = `${radius}${hover || selected}${showHeading ? rotation : ''}`;

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
    const circleFillColor = color;

    const hasStroke = isDisplayStrokeAndDelay || hover || selected;

    const hasDash =
      !!isDisplayStrokeAndDelay &&
      !!useDelayStyle &&
      delay === null &&
      operatorProvidesRealtime === 'yes';

    const hasDelayText =
      showDelayText &&
      isDisplayStrokeAndDelay &&
      (hover || (delay || 0) >= delayDisplay || cancelled);

    const hasDelayBg = showDelayBg && isDisplayStrokeAndDelay && delay !== null;

    const hasHeading = showHeading && isDisplayText && rotation;

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
      text = getDelayText(trajectory, viewState, delay ?? 0, cancelled);
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
      const image = getImage(trajectory, viewState, name, radius);
      if (image) {
        // If an image is provided we use it instead of text
        circleText = image;
      } else {
        const padding = 6 * pixelRatio;
        const fontSize2 = Math.max(radius, 10);

        // Initialize the context font for calculation

        // The canvas automatically round the font size to 1 number after
        // the comma, so we need to round also the fontSize for calculation
        // when the browser is zoomed.
        const toFontFixed = Number(fontSize2.toFixed(1));

        const textSize = getTextSize(
          trajectory,
          viewState,
          circle.getContext('2d') as AnyCanvasContext,
          radius * 2 - padding,
          name,
          toFontFixed,
          getTextFont(trajectory, viewState, toFontFixed, name),
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
export default realtimeStyle;
