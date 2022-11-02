/* eslint-disable no-param-reassign */
import { Pixel } from 'ol/pixel';
import { compose, apply, create } from 'ol/transform';
import {
  AnyCanvas,
  RealtimeRenderState,
  RealtimeStyleFunction,
  RealtimeStyleOptions,
  RealtimeTrajectories,
  ViewState,
} from '../../types';
import getVehiclePosition from './getVehiclePosition';

/**
 * Draw all the trajectories available in a canvas.
 * @param {HTMLCanvas|HTMLOffscreenCanvas} The canvas where to draw the trajectories.
 * @param {ViewState} trajectories An array of trajectories.
 * @param {Function} style A function that returns a canvas representing a vehicle of a specific trajectory.
 * @param {ViewState} viewState The view state of the map.
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
    time = Date.now(),
    size = [],
    center,
    resolution,
    rotation = 0,
    pixelRatio = 1,
  } = viewState;

  if (!resolution || !center) {
    return { renderedTrajectories: [] };
  }

  const {
    noInterpolate = false,
    hoverVehicleId,
    selectedVehicleId,
    filter,
    getScreenPixel = (pixel: Pixel, viewStat: ViewState): Pixel =>
      (viewStat.zoom || 0) < 12
        ? pixel.map((coord) => Math.floor(coord))
        : pixel,
  } = options;
  const context = canvas.getContext('2d');
  context?.clearRect(0, 0, canvas.width, canvas.height);

  const [width, height] = size;
  if (width && height && (canvas.width !== width || canvas.height !== height)) {
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
      // eslint-disable-next-line no-continue
      continue;
    }

    // We simplify the trajectory object
    const { train_id: id, timeOffset } = trajectory.properties;
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
      // eslint-disable-next-line no-continue
      continue;
    }

    let px = apply(coordinateToPixelTransform, [...coord]);
    if (!px) {
      // eslint-disable-next-line no-continue
      continue;
    }

    px = px.map((p) => p * pixelRatio);

    if (
      px[0] < 0 ||
      px[0] > canvas.width ||
      px[1] < 0 ||
      px[1] > canvas.height
    ) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const vehicleImg = style(trajectory, viewState, options);
    if (!vehicleImg) {
      // eslint-disable-next-line no-continue
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
    renderedTrajectories,
  };
};

export default renderTrajectories;
