import { apply, compose, create } from 'ol/transform';

import getVehiclePosition from './getVehiclePosition';

import type { Pixel } from 'ol/pixel';

import type {
  AnyCanvas,
  AnyCanvasContext,
  RealtimeRenderState,
  RealtimeStyleFunction,
  RealtimeStyleOptions,
  RealtimeTrajectories,
  ViewState,
} from '../../types';

/**
 * Draw all the trajectories available in a canvas.
 * @param {HTMLCanvas|HTMLOffscreenCanvas} canvas The canvas where to draw the trajectories.
 * @param {ViewState} trajectories An array of trajectories.
 * @param {Function} style A function that returns a canvas representing a vehicle of a specific trajectory.
 * @param {ViewState} viewState The view state of the map.
 * @param {Object} options The options.
 * @param {boolean} options.hoverVehicleId The id of the vehicle to highlight.
 * @param {boolean} options.selectedVehicleId The id of the vehicle to select.
 * @param {boolean} options.noInterpolate If true trajectories are not interpolated but
 *   drawn at the last known coordinate. Use this for performance optimization
 *   during map navigation.
 * @private
 */
const renderTrajectories = (
  canvas: AnyCanvas,
  trajectories: RealtimeTrajectories,
  style: RealtimeStyleFunction,
  viewState: ViewState,
  options: RealtimeStyleOptions,
): RealtimeRenderState => {
  if (!canvas) {
    return { renderedTrajectories: [] };
  }

  const {
    center,
    pixelRatio = 1,
    resolution,
    rotation = 0,
    size = [],
    time = Date.now(),
  } = viewState;

  if (!resolution || !center) {
    return { renderedTrajectories: [] };
  }

  const {
    filter,
    getScreenPixel = (pixel: Pixel, viewStat: ViewState): Pixel => {
      return (viewStat.zoom || 0) < 12
        ? pixel.map((coord) => {
            return Math.floor(coord);
          })
        : pixel;
    },
    hoverVehicleId,
    noInterpolate = false,
    selectedVehicleId,
  } = options;
  const context: AnyCanvasContext = canvas.getContext('2d') as AnyCanvasContext;
  context?.clearRect(0, 0, canvas.width, canvas.height);

  const [width, height] = size;
  if (
    width &&
    height &&
    (canvas.width !== width * pixelRatio ||
      canvas.height !== height * pixelRatio)
  ) {
    [canvas.width, canvas.height] = [width * pixelRatio, height * pixelRatio];
  }

  const coordinateToPixelTransform = compose(
    create(),
    size[0] / 2,
    size[1] / 2,
    1 / resolution,
    -1 / resolution,
    -rotation,
    -center[0],
    -center[1],
  );

  // Offscreen canvas has not style attribute
  if ((canvas as HTMLCanvasElement).style) {
    (canvas as HTMLCanvasElement).style.width = `${
      canvas.width / pixelRatio
    }px`;
    (canvas as HTMLCanvasElement).style.height = `${
      canvas.height / pixelRatio
    }px`;
  }

  let hoverVehicleImg;
  let hoverVehiclePx;
  let selectedVehicleImg;
  let selectedVehiclePx;
  const renderedTrajectories = [];

  for (let i = trajectories.length - 1; i >= 0; i -= 1) {
    const trajectory = trajectories[i];

    // Filter out trajectories
    if (filter && !filter(trajectory)) {
      continue;
    }

    // We simplify the trajectory object
    const { timeOffset, train_id: id } = trajectory.properties;
    // We set the rotation and the timeFraction of the trajectory (used by tralis).
    // if rotation === null that seems there is no rotation available.
    const { coord, rotation: rotationIcon } = getVehiclePosition(
      time - (timeOffset || 0),
      trajectory,
      noInterpolate,
    );

    // We store  the current vehicle position to the trajectory.
    trajectories[i].properties.coordinate = coord;
    trajectories[i].properties.rotation = rotationIcon;

    if (!coord) {
      continue;
    }

    let px = apply(coordinateToPixelTransform, [...coord]);
    if (!px) {
      continue;
    }

    px = px.map((p) => {
      return p * pixelRatio;
    });

    if (
      px[0] < 0 ||
      px[0] > canvas.width ||
      px[1] < 0 ||
      px[1] > canvas.height
    ) {
      continue;
    }

    const vehicleImg = style(trajectory, viewState, options);
    if (!vehicleImg) {
      continue;
    }

    if (hoverVehicleId !== id && selectedVehicleId !== id) {
      // To optimize the performance we use integer as pixel coordinate
      // to avoid an additional work by the browser on zoom level < 12.
      // See https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas?retiredLocale=de#avoid_floating-point_coordinates_and_use_integers_instead
      const [x, y] = getScreenPixel(
        [px[0] - vehicleImg.width / 2, px[1] - vehicleImg.height / 2],
        viewState,
      );
      context?.drawImage(vehicleImg, x, y);
    }

    if (hoverVehicleId && hoverVehicleId === id) {
      // Store the canvas to draw it at the end
      hoverVehicleImg = vehicleImg;
      hoverVehiclePx = px;
    }

    if (selectedVehicleId && selectedVehicleId === id) {
      // Store the canvas to draw it at the end
      selectedVehicleImg = vehicleImg;
      selectedVehiclePx = px;
    }

    renderedTrajectories.push(trajectory);
  }

  if (selectedVehicleImg && selectedVehiclePx) {
    context?.drawImage(
      selectedVehicleImg,
      Math.floor(selectedVehiclePx[0] - selectedVehicleImg.width / 2),
      Math.floor(selectedVehiclePx[1] - selectedVehicleImg.height / 2),
    );
  }

  if (hoverVehicleImg && hoverVehiclePx) {
    context?.drawImage(
      hoverVehicleImg,
      Math.floor(hoverVehiclePx[0] - hoverVehicleImg.width / 2),
      Math.floor(hoverVehiclePx[1] - hoverVehicleImg.height / 2),
    );
  }
  return {
    // isReady: true,
    renderedTrajectories,
  };
};

export default renderTrajectories;
