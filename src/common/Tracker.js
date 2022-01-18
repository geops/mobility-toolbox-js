import GeomType from 'ol/geom/GeometryType';
import { compose, apply, create } from 'ol/transform';

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
    const opts = {
      interpolate: true,
      ...options,
    };

    /**
     * Pixel ratio to use to draw the canvas. Default to window.devicePixelRatio
     * @type {Array<trajectory>}
     */
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;

    /**
     * Array of trajectories.
     * @type {Array<trajectory>}
     */
    this.trajectories = [];

    /**
     * Array of trajectories that are currently drawn.
     * @type {Array<key>}
     */
    this.renderedTrajectories = [];

    /**
     * Active interpolation calculation or not. If false, the train will not move until we receive the next message for the websocket.
     * @type {boolean}
     */
    this.interpolate = !!opts.interpolate;

    /**
     * Id of the trajectory which is hovered.
     * @type {string}
     */
    this.hoverVehicleId = opts.hoverVehicleId;

    /**
     * Id of the trajectory which is selected.
     * @type {string}
     */
    this.selectedVehicleId = opts.selectedVehicleId;

    /**
     * Function use to filter the features displayed.
     * @type {function}
     */
    this.filter = opts.filter;

    /**
     * Function use to sort the features displayed.
     * @type {function}
     */
    this.sort = opts.sort;

    /**
     * Function use to style the features displayed.
     * @type {function}
     */
    this.style = opts.style;

    // we draw directly on the canvas since openlayers is too slow.
    /**
     * HTML <canvas> element.
     * @type {Canvas}
     */
    this.canvas = opts.canvas || document.createElement('canvas');
    this.canvas.width = opts.width * this.pixelRatio;
    this.canvas.height = opts.height * this.pixelRatio;
    this.canvas.setAttribute(
      'style',
      [
        'position: absolute',
        'top: 0',
        'bottom: 0',
        `width: ${opts.width}px`,
        `height: ${opts.height}px`,
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
   * Define the trajectories.
   * @param {array<ol/Feature~Feature>} trajectories
   */
  setTrajectories(trajectories = []) {
    if (this.sort) {
      trajectories.sort(this.sort);
    }

    this.trajectories = trajectories;
  }

  /**
   * Return the trajectories.
   * @returns {array<trajectory>} trajectories
   */
  getTrajectories() {
    return this.trajectories || [];
  }

  /**
   * Clear the canvas.
   * @private
   */
  clear() {
    if (this.canvasContext) {
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Draw all the trajectories available to the canvas.
   * @param {ViewState} viewState The view state of the map.
   * @param {boolean} noInterpolate If true trajectories are not interpolated but
   *   drawn at the last known coordinate. Use this for performance optimization
   *   during map navigation.
   * @private
   */
  renderTrajectories(viewState, noInterpolate = false) {
    const {
      time = Date.now(),
      size = [],
      center,
      resolution,
      rotation = 0,
      pixelRatio,
    } = viewState;
    this.clear();

    const [width, height] = size;
    if (
      width &&
      height &&
      (this.canvas.width !== width || this.canvas.height !== height)
    ) {
      [this.canvas.width, this.canvas.height] = [
        width * pixelRatio,
        height * pixelRatio,
      ];
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

    this.canvas.style.width = `${this.canvas.width / pixelRatio}px`;
    this.canvas.style.height = `${this.canvas.height / pixelRatio}px`;

    /**
     * Current resolution.
     * @type {number}
     */
    this.currResolution = resolution || this.currResolution;
    let hoverVehicleImg;
    let hoverVehiclePx;
    let hoverVehicleWidth;
    let hoverVehicleHeight;
    let selectedVehicleImg;
    let selectedVehiclePx;
    let selectedVehicleWidth;
    let selectedVehicleHeight;

    this.renderedTrajectories = [];

    for (let i = (this.trajectories || []).length - 1; i >= 0; i -= 1) {
      const traj = this.trajectories[i];

      this.trajectories[i].rendered = false;

      // We simplify the traj object
      const { geometry, timeIntervals, timeOffset } = traj;

      if (this.filter && !this.filter(traj, i, this.trajectories)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      let coord = null;
      let rotationIcon;

      if (traj.coordinate && (noInterpolate || !this.interpolate)) {
        coord = traj.coordinate;
      } else if (timeIntervals && timeIntervals.length > 1) {
        const now = time - (timeOffset || 0);
        let start;
        let end;
        let startFrac;
        let endFrac;
        let timeFrac;

        // Search th time interval.
        for (let j = 0; j < timeIntervals.length - 1; j += 1) {
          // Rotation only available in tralis layer.
          [start, startFrac, rotationIcon] = timeIntervals[j];
          [end, endFrac] = timeIntervals[j + 1];

          if (start <= now && now <= end) {
            break;
          } else {
            start = null;
            end = null;
          }
        }
        // The geometry can also be a Point
        if (geometry.getType() === GeomType.POINT) {
          coord = geometry.getCoordinates();
        } else if (geometry.getType() === GeomType.LINE_STRING) {
          if (start && end) {
            // interpolate position inside the time interval.
            timeFrac = this.interpolate
              ? Math.min((now - start) / (end - start), 1)
              : 0;

            const geomFrac = this.interpolate
              ? timeFrac * (endFrac - startFrac) + startFrac
              : 0;

            coord = geometry.getCoordinateAt(geomFrac);

            // We set the rotation and the timeFraction of the trajectory (used by tralis).
            this.trajectories[i].rotation = rotationIcon;
            this.trajectories[i].endFraction = timeFrac;

            // It happens that the now date was some ms before the first timeIntervals we have.
          } else if (now < timeIntervals[0][0]) {
            [[, , rotationIcon]] = timeIntervals;
            timeFrac = 0;
            coord = geometry.getFirstCoordinate();
          } else if (now > timeIntervals[timeIntervals.length - 1][0]) {
            [, , rotationIcon] = timeIntervals[timeIntervals.length - 1];
            timeFrac = 1;
            coord = geometry.getLastCoordinate();
          }
        } else {
          // eslint-disable-next-line no-console
          console.error(
            'This geometry type is not supported. Only Point or LineString are. Current geometry: ',
            geometry,
          );
        }
        // We set the rotation and the timeFraction of the trajectory (used by tralis).
        // if rotation === null that seems there is no rotation available.
        this.trajectories[i].rotation = rotationIcon;
        this.trajectories[i].endFraction = timeFrac || 0;
      }

      if (coord) {
        // We set the rotation of the trajectory (used by tralis).
        this.trajectories[i].coordinate = coord;
        let px = apply(coordinateToPixelTransform, [...coord]);
        if (!px) {
          // eslint-disable-next-line no-continue
          continue;
        }

        px = px.map((p) => {
          return p * pixelRatio;
        });

        if (
          px[0] < 0 ||
          px[0] > this.canvas.width ||
          px[1] < 0 ||
          px[1] > this.canvas.height
        ) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const vehicleImg = this.style(traj, viewState);
        if (!vehicleImg) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // Trajectory with pixel (i.e. within map extent) will be in renderedTrajectories.
        this.trajectories[i].rendered = true;
        this.renderedTrajectories.push(this.trajectories[i]);

        const imgWidth = vehicleImg.width;
        const imgHeight = vehicleImg.height;

        if (
          this.hoverVehicleId !== traj.id &&
          this.selectedVehicleId !== traj.id
        ) {
          this.canvasContext.drawImage(
            vehicleImg,
            px[0] - imgWidth / 2,
            px[1] - imgHeight / 2,
            imgWidth,
            imgHeight,
          );
        }
        if (this.hoverVehicleId === traj.id) {
          // Store the canvas to draw it at the end
          hoverVehicleImg = vehicleImg;
          hoverVehiclePx = px;
          hoverVehicleWidth = imgWidth;
          hoverVehicleHeight = imgHeight;
        }

        if (this.selectedVehicleId === traj.id) {
          // Store the canvas to draw it at the end
          selectedVehicleImg = vehicleImg;
          selectedVehiclePx = px;
          selectedVehicleWidth = imgWidth;
          selectedVehicleHeight = imgHeight;
        }
      }
    }

    if (selectedVehicleImg) {
      this.canvasContext.drawImage(
        selectedVehicleImg,
        selectedVehiclePx[0] - selectedVehicleWidth / 2,
        selectedVehiclePx[1] - selectedVehicleHeight / 2,
        selectedVehicleWidth,
        selectedVehicleHeight,
      );
    }

    if (hoverVehicleImg) {
      this.canvasContext.drawImage(
        hoverVehicleImg,
        hoverVehiclePx[0] - hoverVehicleWidth / 2,
        hoverVehiclePx[1] - hoverVehicleHeight / 2,
        hoverVehicleWidth,
        hoverVehicleHeight,
      );
    }
  }

  /**
   * Clean the canvas and the events the tracker.
   * @private
   */
  destroy() {
    this.renderedTrajectories = [];
    this.clear();
  }
}
