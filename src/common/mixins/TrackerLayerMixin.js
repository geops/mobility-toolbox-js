/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { buffer, containsCoordinate } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import Tracker from '../Tracker';
import { timeSteps } from '../trackerConfig';

/**
 * TrackerLayerInterface.
 *
 * @classproperty {boolean} isTrackerLayer - Property for duck typing since `instanceof` is not working when the instance was created on different bundles.
 * @classproperty {boolean} isHoverActive - Activate/deactivate pointer hover effect.
 * @classproperty {function} style - Style of the vehicle.
 * @classproperty {FilterFunction} filter - Time speed.
 * @classproperty {function} sort - Set the filter for tracker features.
 */
export class TrackerLayerInterface {
  /**
   * Initalize the Tracker.
   * @param map
   * @param {Object} options
   * @param {number} [options.width] Canvas's width.
   * @param {number} [options.height] Canvas's height.
   * @param {function} [options.getPixelFromCoordinate] Convert an EPSG:3857 coordinate to a canvas pixel (origin top-left).
   */
  // eslint-disable-next-line no-unused-vars
  init(map, options) {}

  /**
   * Destroy the Tracker.
   */
  terminate() {}

  /**
   * Start the clock.
   *
   * @param {Array<number>} size Map's size: [width, height].
   * @param {number} zoom Map's zoom level.
   * @param {number} resolution Map's resolution.
   */
  // eslint-disable-next-line no-unused-vars
  start(size, zoom, resolution) {}

  // eslint-disable-next-line no-unused-vars
  startUpdateTime(zoom) {}

  /**
   * Stop the clock.
   */
  stop() {}

  stopUpdateTime() {}

  /**
   * Set the current time, it triggers a rendering of the trajectories.
   * @param {dateString | value} time
   */
  // eslint-disable-next-line no-unused-vars
  setCurrTime(time, size, resolution) {}

  /**
   * Get vehicle.
   * @param {function} filterFc A function use to filter results.
   */
  // eslint-disable-next-line no-unused-vars
  getVehicle(filterFc) {}

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol.coordinate} coordinate
   * @returns {ol.feature | null} Vehicle feature
   */
  // eslint-disable-next-line no-unused-vars
  getVehiclesAtCoordinate(coordinate, resolution = 1) {}

  /**
   * Get the duration before the next update depending on zoom level.
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  getRefreshTimeInMs(zoom) {}

  /**
   * Define a default style of the vehicle.s
   * Draw a blue circle with the id of the props parameter.
   *
   * @param {Object} props Properties
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  defaultStyle(props) {}
}

/**
 * Mixin for TrackeLayerInterface.
 *
 * @param {Class} Base  A class to extend with {TrackerLayerInterface} functionnalities.
 * @return {Class}  A class that implements <TrackerLayerInterface> class and extends Base;
 */
const TrackerLayerMixin = (Base) =>
  class extends Base {
    defineProperties(options) {
      const { isHoverActive, style, speed } = {
        isHoverActive: true,
        ...options,
      };
      let cuurSpeed = speed || 1;
      super.defineProperties(options);
      Object.defineProperties(this, {
        isTrackerLayer: { value: true },
        isHoverActive: {
          value: !!isHoverActive,
          writable: true,
        },
        style: {
          value: style || this.defaultStyle,
        },
        speed: {
          get: () => cuurSpeed,
          set: (newSpeed) => {
            cuurSpeed = newSpeed;
            this.start();
          },
        },
        filter: {
          get: () => this.tracker.filter,
          set: (filter) => {
            if (this.tracker) {
              this.tracker.setFilter(filter);
            }
          },
        },
        sort: {
          get: () => this.tracker.sort,
          set: (sort) => {
            if (this.sort) {
              this.tracker.setSort(sort);
            }
          },
        },

        /**
         * The tracker that renders the trajectories.
         */
        tracker: { value: null, writable: true },

        /**
         * Canvas cache object for trajectories drawn.
         */
        styleCache: { value: {} },

        /**
         * Time used to display the trajectories.
         */
        currTime: {
          value: new Date(),
          writable: true,
        },

        /**
         * Keep track of the last time used to render trajectories.
         * Useful when the speed increase.
         */
        lastUpdateTime: {
          value: new Date(),
          writable: true,
        },

        /**
         * Keep track of which trajectories are currently drawn.
         */
        renderedTrajectories: {
          get: () => this.tracker.renderedTrajectories,
        },
      });
    }

    /**
     * Initalize the Tracker.
     * @param map
     * @param {Object} options
     * @param {Number} [options.width] Canvas's width.
     * @param {Number} [options.height] Canvas's height.
     * @param {function} [options.getPixelFromCoordinate] Convert an EPSG:3857 coordinate to a canvas pixel (origin top-left).
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
     * @param {function} filterFc A function use to filter results.
     */
    getVehicle(filterFc) {
      return this.tracker.getTrajectories().filter(filterFc);
    }

    /**
     * Returns an array of vehicles located at the given coordinates and resolution.
     *
     * @param {number[2]} coordinate
     * @param {number[2]} resolution
     * @returns {Object[]} Array of vehicle.
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
  };

export default TrackerLayerMixin;
