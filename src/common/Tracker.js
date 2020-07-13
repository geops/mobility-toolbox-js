import { unByKey } from 'ol/Observable';

/**
 * Tracker. This class draw trajectories on a canvas.
 * @class
 * @param {Object} options
 * @private
 */
export default class Tracker {
  constructor(options) {
    const opts = {
      interpolate: true,
      ...options,
    };
    this.trajectories = [];
    this.renderedTrajectories = [];
    this.interpolate = !!opts.interpolate;
    this.getPixelFromCoordinate = opts.getPixelFromCoordinate;
    this.hoverVehicleId = null;

    // we draw directly on the canvas since openlayers is too slow.
    this.canvas = opts.canvas || document.createElement('canvas');
    this.canvas.width = opts.width;
    this.canvas.height = opts.height;
    this.canvas.setAttribute(
      'style',
      [
        'position: absolute',
        'top: 0',
        'bottom: 0',
        'right: 0',
        'left: 0',
        'pointer-events: none',
        'visibility: visible',
        'margin-top: inherit', // for scrolling behavior.
      ].join(';'),
    );
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
   * @param {array<ol.feature>} trajectories
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
   * Return rendered trajectories.
   * Use this to avoid race conditions while rendering.
   * @returns {array<trajectory>} trajectories
   */
  getRenderedTrajectories() {
    return this.renderedTrajectories;
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
   * Set the filter for tracker features.
   * @param {function} filter Filter function.
   */
  setFilter(filter) {
    this.filter = filter;
  }

  /**
   * Set the sort for tracker features.
   * @param {function} sort Sort function.
   */
  setSort(sort) {
    this.sort = sort;
  }

  /**
   * Set the id of the trajectory which is hovered.
   * @param {string} id Id of a vehicle.
   * @private
   */
  setHoverVehicleId(id) {
    if (id !== this.hoverVehicleId) {
      this.hoverVehicleId = id;
      this.renderTrajectories();
    }
  }

  /**
   * Set the tracker style.
   * @param {function} s OpenLayers style function.
   */
  setStyle(s) {
    this.style = s;
  }

  /**
   * Draw all the trajectories available to the canvas.
   * @param {Date} currTime
   * @private
   */
  renderTrajectories(currTime = Date.now(), size = [], resolution) {
    this.clear();
    const [width, height] = size;
    if (
      width &&
      height &&
      (this.canvas.width !== width || this.canvas.height !== height)
    ) {
      [this.canvas.width, this.canvas.height] = [width, height];
    }
    this.currResolution = resolution || this.currResolution;
    let hoverVehicleImg;
    let hoverVehiclePx;

    for (let i = (this.trajectories || []).length - 1; i >= 0; i -= 1) {
      const traj = this.trajectories[i];

      // We simplify the traj object
      const { geometry, timeIntervals, timeOffset } = traj;

      if (this.filter && !this.filter(traj)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      let coord = null;
      let rotation;

      if (timeIntervals && timeIntervals.length > 1) {
        const now = currTime - (timeOffset || 0);
        let start;
        let end;
        let startFrac;
        let endFrac;
        let timeFrac;

        // Search th time interval.
        for (let j = 0; j < timeIntervals.length - 1; j += 1) {
          // Rotation only available in tralis layer.
          [start, startFrac, rotation] = timeIntervals[j];
          [end, endFrac] = timeIntervals[j + 1];

          if (start <= now && now <= end) {
            break;
          } else {
            start = null;
            end = null;
          }
        }

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
          this.trajectories[i].rotation = rotation;
          this.trajectories[i].endFraction = timeFrac;

          // It happens that the now date was some ms before the first timeIntervals we have.
        } else if (now < timeIntervals[0][0]) {
          [[, , rotation]] = timeIntervals;
          timeFrac = 0;
          coord = geometry.getFirstCoordinate();
        } else if (now > timeIntervals[timeIntervals.length - 1][0]) {
          [, , rotation] = timeIntervals[timeIntervals.length - 1];
          timeFrac = 1;
          coord = geometry.getLastCoordinate();
        }

        // We set the rotation and the timeFraction of the trajectory (used by tralis).
        this.trajectories[i].rotation = rotation || 0;
        this.trajectories[i].endFraction = timeFrac || 0;
      }

      if (coord) {
        // We set the rotation of the trajectory (used by tralis).
        this.trajectories[i].coordinate = coord;
        const px = this.getPixelFromCoordinate(coord);

        if (!px) {
          // eslint-disable-next-line no-continue
          continue;
        }
        // Trajectory with pixel (i.e. within map extent) will be in renderedTrajectories.
        this.trajectories[i].rendered = true;

        const vehicleImg = this.style(traj, this.currResolution);
        if (this.hoverVehicleId !== traj.id) {
          this.canvasContext.drawImage(
            vehicleImg,
            px[0] - vehicleImg.height / 2,
            px[1] - vehicleImg.height / 2,
          );
        } else {
          // Store the canvas to draw it at the end
          hoverVehicleImg = vehicleImg;
          hoverVehiclePx = px;
        }
      }
    }
    if (hoverVehicleImg) {
      this.canvasContext.drawImage(
        hoverVehicleImg,
        hoverVehiclePx[0] - hoverVehicleImg.height / 2,
        hoverVehiclePx[1] - hoverVehicleImg.height / 2,
      );
    }
    this.renderedTrajectories = this.trajectories.filter((t) => t.rendered);
  }

  /**
   * Clean the canvas and the events the tracker.
   * @private
   */
  destroy() {
    unByKey(this.olEventsKeys);
    this.renderedTrajectories = [];
    this.clear();
  }
}
