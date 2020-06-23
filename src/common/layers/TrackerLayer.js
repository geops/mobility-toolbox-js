import { buffer, containsCoordinate } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import Tracker from '../Tracker';
import { timeSteps } from '../trackerConfig';
/**
 *Common  TrackerLayer.
 */
class TrackerLayer {
  /**
   * Define layer's properties.
   *
   * @ignore
   */
  defineProperties(options) {
    const { isHoverActive, style, speed } = {
      isHoverActive: true,
      ...options,
    };
    let cuurSpeed = speed || 1;
    super.defineProperties(options);
    Object.defineProperties(this, {
      /**
       * Property for duck typing since `instanceof` is not working
       * when the instance was created on different bundles.
       * @type {boolean}
       */
      isTrackerLayer: { value: true, writable: true },

      /**
       * The tracker that renders the trajectories.
       * @private
       */
      tracker: { value: null, writable: true },

      /**
       * Canvas cache object for trajectories drawn.
       * @private
       */
      styleCache: { value: {} },

      /**
       * Time used to display the trajectories.
       * @private
       */
      currTime: {
        value: new Date(),
        writable: true,
      },

      /**
       * Keep track of the last time used to render trajectories.
       * Useful when the speed increase.
       * @private
       */
      lastUpdateTime: {
        value: new Date(),
        writable: true,
      },

      /**
       * Activate/deactivate pointer hover effect.
       */
      isHoverActive: {
        value: !!isHoverActive,
        writable: true,
      },

      /**
       * Style of the vehicle.
       */
      style: {
        value: style || this.defaultStyle,
      },

      /**
       * Time speed.
       */
      speed: {
        get: () => cuurSpeed,
        set: (newSpeed) => {
          cuurSpeed = newSpeed;
          this.start();
        },
      },

      /**
       * Set the filter for tracker features.
       * @param {Function} filter Filter function.
       */
      filter: {
        get: () => this.tracker.filter,
        set: (filter) => {
          if (this.tracker) {
            this.tracker.setFilter(filter);
          }
        },
      },

      /**
       * Set the sort for tracker features.
       * @param {Function} sort Sort function.
       * @type {Function} isTrackerLayer
       */
      sort: {
        get: () => this.tracker.sort,
        set: (sort) => {
          if (this.sort) {
            this.tracker.setSort(sort);
          }
        },
      },
    });
    /**
     * istrackerlayer
     * @type {boolean} isTrackerLayer
     */
    this.isTrackerLayer = true;
  }

  /**
   * Initalize the Tracker.
   * @param map
   * @param {Object} options
   * @param {Number} [options.width] Canvas's width.
   * @param {Number} [options.height] Canvas's height.
   * @param {Function} [options.getPixelFromCoordinate] Convert an EPSG:3857 coordinate to a canvas pixel (origin top-left).
   */
  init(map, options) {
    super.init(map);
    this.tracker = new Tracker(options);
    this.tracker.setStyle((props, r) => this.style(props, r));

    if (this.visible) {
      this.start();
    }

    this.visibilityRef = this.on('change:visible', (evt) => {
      if (evt.target.visible) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  /**
   * Destroy the Tracker.
   */
  terminate() {
    this.stop();
    unByKey(this.visibilityRef);
    if (this.tracker) {
      this.tracker.destroy();
      this.tracker = null;
    }
    super.terminate();
  }

  /**
   * Start the clock.
   *
   * @param {Array<Number>} size Map's size: [width, height].
   * @param {Number} zoom Map's zoom level.
   * @param {Number} resolution Map's resolution.
   */
  start(size, zoom, resolution) {
    this.stop();
    this.tracker.setVisible(true);
    this.tracker.renderTrajectories(this.currTime, size, resolution);
    this.startUpdateTime(zoom);
  }

  startUpdateTime(zoom) {
    this.updateTimeInterval = setInterval(() => {
      const newTime =
        this.currTime.getTime() +
        (new Date() - this.lastUpdateTime) * this.speed;
      this.setCurrTime(newTime);
    }, this.getRefreshTimeInMs(zoom));
  }

  /**
   * Stop the clock.
   */
  stop() {
    this.stopUpdateTime();
    if (this.tracker) {
      this.tracker.setVisible(false);
      this.tracker.clear();
    }
  }

  stopUpdateTime() {
    clearInterval(this.updateTimeInterval);
  }

  /**
   * Set the current time, it triggers a rendering of the trajectories.
   * @param {dateString | value} time
   */
  setCurrTime(time, size, resolution) {
    const newTime = new Date(time);
    this.currTime = newTime;
    this.lastUpdateTime = new Date();
    this.tracker.renderTrajectories(this.currTime, size, resolution);
  }

  /**
   * Get vehicle.
   * @param {Function} filterFc A function use to filter results.
   */
  getVehicle(filterFc) {
    return this.tracker.getTrajectories().filter(filterFc);
  }

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol.coordinate} coordinate
   * @returns {ol.feature | null} Vehicle feature
   */
  getVehiclesAtCoordinate(coordinate, resolution = 1) {
    const ext = buffer([...coordinate, ...coordinate], 10 * resolution);
    const trajectories = this.tracker.getTrajectories();
    const vehicles = [];
    for (let i = 0; i < trajectories.length; i += 1) {
      if (
        trajectories[i].coordinate &&
        containsCoordinate(ext, trajectories[i].coordinate)
      ) {
        vehicles.push(trajectories[i]);
      }
    }

    return vehicles;
  }

  /**
   * Get the duration before the next update depending on zoom level.
   * @private
   */
  getRefreshTimeInMs(zoom) {
    const roundedZoom = Math.round(zoom);
    const timeStep = timeSteps[roundedZoom] || 25;
    const nextTick = Math.max(25, timeStep / this.speed);
    return nextTick;
  }

  /**
   * Define a default style of the vehicle.s
   * Draw a blue circle with the id of the props parameter.
   *
   * @param {Object} props Properties
   * @private
   */
  defaultStyle(props) {
    const { id: text } = props;
    if (this.styleCache[text]) {
      return this.styleCache[text];
    }
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 15;
    const ctx = canvas.getContext('2d');
    ctx.arc(8, 8, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#8ED6FF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.font = 'bold 12px arial';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeText(text, 20, 10);
    ctx.fillStyle = 'black';
    ctx.fillText(text, 20, 10);
    this.styleCache[text] = canvas;
    return this.styleCache[text];
  }
}

export default TrackerLayer;
