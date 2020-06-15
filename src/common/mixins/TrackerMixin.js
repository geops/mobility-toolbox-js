import { buffer, containsCoordinate } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import Tracker from '../Tracker';
import { timeSteps } from '../trackerConfig';

export default (Base) =>
  class TrackerMixin extends Base {
    constructor(options) {
      super(options);

      /**
       * Cache object for trajectories drawn.
       * @private
       */
      this.styleCache = {};

      /**
       * Time speed.
       * @private
       */
      this.speed = 1;

      /**
       * Time used to display the trajectories.
       * @private
       */
      this.currTime = new Date();

      /**
       * Keep track of the last time used to render trajectories.
       * Useful when the speed increase.
       * @private
       */
      this.lastUpdateTime = new Date();

      /**
       * Activate/deactivate pointer hover effect.
       * @private
       */
      this.isHoverActive =
        options.isHoverActive !== undefined ? options.isHoverActive : true;

      /**
       * Callback function when a user click on a vehicle.
       * @private
       */
      this.clickCallbacks = [];

      // Add click callback
      if (options.onClick) {
        this.onClick(options.onClick);
      }

      /**
       * Custom property for duck typing since `instanceof` is not working
       * when the instance was created on different bundles.
       * @public
       */
      this.isTrackerLayer = true;
    }

    initTracker(options) {
      this.tracker = new Tracker(options);
      this.tracker.setStyle((props, r) => this.style(props, r));

      if (this.visible) {
        this.start();
      }

      this.visibilityRef = this.on('change:visible', (evt) => {
        if (evt.target.getVisible()) {
          this.start();
        } else {
          this.stop();
        }
      });
    }

    /**
     * @private
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
     * @param {ol.map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map}
     * @private
     */
    start(size, zoom, resolution) {
      this.stop();
      this.tracker.setVisible(true);
      this.tracker.renderTrajectories(this.currTime, size, resolution);
      this.startUpdateTime(zoom);
    }

    /**
     * Stop the clock.
     * @private
     */
    stop() {
      this.stopUpdateTime();
      if (this.tracker) {
        this.tracker.setVisible(false);
        this.tracker.clear();
      }
    }

    /**
     * Start to update the current time depending on the speed.
     * @private
     */
    startUpdateTime(zoom) {
      this.stopUpdateTime();
      this.updateTime = setInterval(() => {
        const newTime =
          this.currTime.getTime() +
          (new Date() - this.lastUpdateTime) * this.speed;
        this.setCurrTime(newTime);
      }, this.getRefreshTimeInMs(zoom));
    }

    /**
     * Stop to update time.
     * @private
     */
    stopUpdateTime() {
      clearInterval(this.updateTime);
    }

    /**
     * Set the current time, it triggers a rendering of the trajectories.
     * @param {dateString | value} time
     */
    setCurrTime(time, size, resolution, allowUpdate) {
      const newTime = new Date(time);
      this.currTime = newTime;
      this.lastUpdateTime = new Date();
      if (allowUpdate) {
        this.tracker.renderTrajectories(this.currTime, size, resolution);
      }
    }

    /**
     * Set the speed.
     * @param {number} speed
     */
    setSpeed(speed) {
      this.speed = speed;
      this.start();
    }

    /**
     * Set the filter for tracker features.
     * @param {Function} filter Filter function.
     */
    setFilter(filter) {
      if (this.tracker) {
        this.tracker.setFilter(filter);
      }
    }

    /**
     * Set the sort for tracker features.
     * @param {Function} sort Sort function.
     */
    setSort(sort) {
      if (this.tracker) {
        this.tracker.setSort(sort);
      }
    }

    getVehicle(filterFc) {
      return this.tracker.getTrajectories().filter(filterFc);
    }

    /**
     * Returns the vehicle which are at the given coordinates.
     * Returns null when no vehicle is located at the given coordinates.
     * @param {ol.coordinate} coordinate
     * @returns {ol.feature | null} Vehicle feature
     * @private
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
     * Define the style of the vehicle.
     * Draw a blue circle with the id of the props parameter.
     *
     * @param {Object} props Properties
     * @private
     */
    style(props) {
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

    /**
     * Listens to click events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features,
     *   the layer instance and the click event.
     */
    onClick(callback) {
      if (typeof callback === 'function') {
        if (!this.clickCallbacks.includes(callback)) {
          this.clickCallbacks.push(callback);
        }
      } else {
        throw new Error('callback must be of type function.');
      }
    }

    /**
     * Unlistens to click events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features,
     *   the layer instance and the click event.
     */
    unClick(callback) {
      if (typeof callback === 'function') {
        const idx = this.clickCallbacks.indexOf(callback);
        if (idx >= -1) {
          this.clickCallbacks.splice(idx, 1);
        }
      }
    }
  };
