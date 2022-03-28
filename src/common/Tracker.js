/* eslint-disable no-param-reassign */
import { compose, apply, create } from 'ol/transform';
import getVehiclePosition from './utils/getVehiclePosition';

/**
 * Tracker. This class stores and allows to draw trajectories on a canvas.
 * @class
 * @param {Object} options
 * @private
 */
export default class Tracker {
  /**
   * @private
   */
  constructor(options) {
    /**
     * Function use to style the features displayed.
     * @type {function}
     */
    this.style = options.style;

    // we draw directly on the canvas since openlayers is too slow.
    /**
     * HTML <canvas> element.
     * @type {Canvas}
     */
    this.canvas = options.canvas || document.createElement('canvas');
    this.canvas.width = options.width * this.pixelRatio;
    this.canvas.height = options.height * this.pixelRatio;
    this.canvas.setAttribute(
      'style',
      [
        'position: absolute',
        'top: 0',
        'bottom: 0',
        `width: ${options.width}px`,
        `height: ${options.height}px`,
        'pointer-events: none',
        'visibility: visible',
        'margin-top: inherit', // for scrolling behavior.
      ].join(';'),
    );
    /**
     * 2d drawing context on the canvas.
     * @type {CanvasRenderingContext2D}
     */
    this.canvasContext = this.canvas.getContext('2d');
  }

  /**
   * Set visibility of the canvas.
   * @param {boolean} visible The visibility of the layer
   */
  setVisible(visible) {
    if (this.canvas) {
      this.canvas.style.visibility = visible ? 'visible' : 'hidden';
    }
  }

  /**
   * Clear the canvas.
   * @private
   */
  clear() {
    if (this.canvas) {
      this.canvas
        .getContext('2d')
        .clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Draw all the trajectories available to the canvas.
   * @param {ViewState} trajectories An array of trajectories.
   * @param {ViewState} viewState The view state of the map.
   * @param {boolean} options.hoverVehicleId The id of the vehicle to highlight.
   * @param {boolean} options.selectedVehicleId The id of the vehicle to select.
   * @param {boolean} options.noInterpolate If true trajectories are not interpolated but
   *   drawn at the last known coordinate. Use this for performance optimization
   *   during map navigation.
   * @private
   */
  renderTrajectories(trajectories, viewState, options) {
    const {
      time = Date.now(),
      size = [],
      center,
      resolution,
      rotation = 0,
      pixelRatio,
    } = viewState;
    const {
      noInterpolate = false,
      hoverVehicleId,
      selectedVehicleId,
    } = options;
    this.clear();

    const { canvas } = this;
    const context = canvas.getContext('2d');
    const [width, height] = size;
    if (
      width &&
      height &&
      (canvas.width !== width || canvas.height !== height)
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

    canvas.style.width = `${canvas.width / pixelRatio}px`;
    canvas.style.height = `${canvas.height / pixelRatio}px`;

    let hoverVehicleImg;
    let hoverVehiclePx;
    let hoverVehicleWidth;
    let hoverVehicleHeight;
    let selectedVehicleImg;
    let selectedVehiclePx;
    let selectedVehicleWidth;
    let selectedVehicleHeight;
    let nbRendered = 0;

    for (let i = trajectories.length - 1; i >= 0; i -= 1) {
      const trajectory = trajectories[i];

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

      const vehicleImg = this.style(trajectory, viewState, options);
      if (!vehicleImg) {
        // eslint-disable-next-line no-continue
        continue;
      }

      nbRendered += 1;

      const imgWidth = vehicleImg.width;
      const imgHeight = vehicleImg.height;

      if (hoverVehicleId !== id && selectedVehicleId !== id) {
        context.drawImage(
          vehicleImg,
          px[0] - imgWidth / 2,
          px[1] - imgHeight / 2,
          imgWidth,
          imgHeight,
        );
      }

      if (hoverVehicleId && hoverVehicleId === id) {
        // Store the canvas to draw it at the end
        hoverVehicleImg = vehicleImg;
        hoverVehiclePx = px;
        hoverVehicleWidth = imgWidth;
        hoverVehicleHeight = imgHeight;
      }

      if (selectedVehicleId && selectedVehicleId === id) {
        // Store the canvas to draw it at the end
        selectedVehicleImg = vehicleImg;
        selectedVehiclePx = px;
        selectedVehicleWidth = imgWidth;
        selectedVehicleHeight = imgHeight;
      }
    }

    if (selectedVehicleImg) {
      context.drawImage(
        selectedVehicleImg,
        selectedVehiclePx[0] - selectedVehicleWidth / 2,
        selectedVehiclePx[1] - selectedVehicleHeight / 2,
        selectedVehicleWidth,
        selectedVehicleHeight,
      );
    }

    if (hoverVehicleImg) {
      context.drawImage(
        hoverVehicleImg,
        hoverVehiclePx[0] - hoverVehicleWidth / 2,
        hoverVehiclePx[1] - hoverVehicleHeight / 2,
        hoverVehicleWidth,
        hoverVehicleHeight,
      );
    }
    return {
      nbTrajectoriesRendered: nbRendered,
    };
  }
}
