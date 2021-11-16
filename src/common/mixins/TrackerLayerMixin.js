/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { buffer, containsCoordinate } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import Feature from 'ol/Feature';
import Tracker from '../Tracker';
import { timeSteps } from '../trackerConfig';

/**
 * TrackerLayerInterface.
 *
 * @classproperty {string} hoverVehicleId - Id of the hovered vehicle.
 * @classproperty {string} selectedVehicleId - Id of the selected vehicle.
 * @classproperty {number} pixelRatio - Pixel ratio use to render the trajectories. Default to window.devicePixelRatio.
 * @classproperty {boolean} live - If true, the layer will always use Date.now() to render trajectories. Default to true.
 * @classproperty {boolean} useRequestAnimationFrame - If true, encapsulates the renderTrajectories calls in a requestAnimationFrame. Experimental.
 * @classproperty {boolean} isTrackerLayer - Property for duck typing since `instanceof` is not working when the instance was created on different bundles.
 * @classproperty {function} sort - Sort the trajectories.
 * @classproperty {function} style - Style of a trajectory.
 * @classproperty {Date} time - Time used to display the trajectories. The setter manages a Date or a number in ms representing a Date. If `live` property is true. The setter does nothing..
 * @classproperty {FilterFunction} filter - Filter the trajectories.
 */
export class TrackerLayerInterface {
  /**
   * Initalize the Tracker.
   * @param {ol/Map~Map} map
   * @param {Object} options
   * @param {number} [options.width] Canvas's width.
   * @param {number} [options.height] Canvas's height.
   */
  // eslint-disable-next-line no-unused-vars
  init(map, options) {}

  /**
   * Destroy the Tracker.
   */
  terminate() {}

  /**
   * Start the clock.
   */
  start() {}

  /**
   * Start the timeout for the next update.
   * @private
   * @param {number} zoom
   */
  // eslint-disable-next-line no-unused-vars
  startUpdateTime(zoom) {}

  /**
   * Stop the clock.
   */
  stop() {}

  /**
   * Get vehicle.
   * @param {function} filterFc A function use to filter results.
   */
  // eslint-disable-next-line no-unused-vars
  getVehicle(filterFc) {}

  /**
   * Returns the list of vehicles which are at the given coordinates.
   * Returns an empty array when no vehicle is located at the given
   * coordinates.
   *
   * @param {number[2]} coordinate A coordinate ([x,y]).
   * @param {number} [resolution=1] The resolution of the map.
   * @param {number} [nb=Infinity] nb The max number of vehicles to return.
   * @returns {Array<ol/Feature~Feature>} Array of vehicles.
   */
  // eslint-disable-next-line no-unused-vars
  getVehiclesAtCoordinate(coordinate, resolution = 1, nb = Infinity) {}

  /**
   * Get the duration before the next update depending on zoom level.
   * @private
   * @param {number} zoom
   */
  // eslint-disable-next-line no-unused-vars
  getRefreshTimeInMs(zoom) {}

  /**
   * Define a default style of vehicles.
   * Draw a blue circle with the id of the props parameter.
   *
   * @param {Object} trajectory A trajectory
   * @param {ViewState} viewState Map's view state (zoom, resolution, center, ...)
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  defaultStyle(trajectory, viewState) {}
}

/**
 * Mixin for TrackeLayerInterface.
 *
 * @param {Class} Base  A class to extend with {TrackerLayerInterface} functionnalities.
 * @return {Class}  A class that implements <TrackerLayerInterface> class and extends Base;
 * @private
 */
const TrackerLayerMixin = (Base) =>
  class extends Base {
    constructor(options) {
      super({ hitTolerance: 10, ...options });
      this.onFeatureHover = this.onFeatureHover.bind(this);
      this.onFeatureClick = this.onFeatureClick.bind(this);
    }

    /**
     * Define layer's properties.
     *
     * @ignore
     */
    defineProperties(options) {
      const { style, speed } = {
        ...options,
      };

      // Tracker options use to build the tracker.
      const {
        pixelRatio,
        interpolate,
        hoverVehicleId,
        selectedVehicleId,
        filter,
        sort,
        time,
        live,
      } = options;

      const initTrackerOptions = {
        pixelRatio: pixelRatio || window.devicePixelRatio || 1,
        interpolate,
        hoverVehicleId,
        selectedVehicleId,
        filter,
        sort,
        style,
      };

      Object.keys(initTrackerOptions).forEach(
        (key) =>
          initTrackerOptions[key] === undefined &&
          delete initTrackerOptions[key],
      );

      let currSpeed = speed || 1;
      let currTime = time || new Date();

      super.defineProperties(options);

      Object.defineProperties(this, {
        isTrackerLayer: { value: true },

        /**
         * Style function used to render a vehicle.
         */
        style: {
          value: style || this.defaultStyle,
        },

        /**
         * Speed of the wheel of time.
         * If live property is true. The speed is ignored.
         */
        speed: {
          get: () => currSpeed,
          set: (newSpeed) => {
            currSpeed = newSpeed;
            this.start();
          },
        },

        /**
         * Function to filter which vehicles to display.
         */
        filter: {
          get: () =>
            this.tracker ? this.tracker.filter : this.initTrackerOptions.filter,
          set: (newFilter) => {
            if (this.tracker) {
              this.tracker.filter = newFilter;
            } else {
              this.initTrackerOptions.filter = newFilter;
            }
          },
        },

        /**
         * Function to sort the vehicles to display.
         */
        sort: {
          get: () =>
            this.tracker ? this.tracker.sort : this.initTrackerOptions.sort,
          set: (newSort) => {
            if (this.tracker) {
              this.tracker.sort = newSort;
            } else {
              this.initTrackerOptions.sort = newSort;
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
         * If true. The layer will always use Date.now() on the next tick to render the trajectories.
         * When true, setting the time property has no effect.
         */
        live: {
          value: live === false ? live : true,
          writable: true,
        },

        /**
         * Time used to display the trajectories. Can be a Date or a number in ms representing a Date.
         * If live property is true. The setter does nothing.
         */
        time: {
          get: () => currTime,
          set: (newTime) => {
            currTime = newTime && newTime.getTime ? newTime : new Date(newTime);
            this.renderTrajectories();
          },
        },

        /**
         * Keep track of which trajectories are stored.
         */
        trajectories: {
          get: () => (this.tracker && this.tracker.trajectories) || [],
        },

        /**
         * Keep track of which trajectories are currently drawn.
         */
        renderedTrajectories: {
          get: () => (this.tracker && this.tracker.renderedTrajectories) || [],
        },

        /**
         * Id of the hovered vehicle.
         */
        hoverVehicleId: {
          get: () => {
            return this.tracker
              ? this.tracker.hoverVehicleId
              : this.initTrackerOptions.hoverVehicleId;
          },
          set: (newHoverVehicleId) => {
            if (this.tracker) {
              this.tracker.hoverVehicleId = newHoverVehicleId;
            } else {
              this.initTrackerOptions.hoverVehicleId = newHoverVehicleId;
            }
          },
        },

        /**
         * Id of the selected vehicle.
         */
        selectedVehicleId: {
          get: () =>
            this.tracker
              ? this.tracker.selectedVehicleId
              : this.initTrackerOptions.selectedVehicleId,
          set: (newSelectedVehicleId) => {
            if (this.tracker) {
              this.tracker.selectedVehicleId = newSelectedVehicleId;
            } else {
              this.initTrackerOptions.selectedVehicleId = newSelectedVehicleId;
            }
          },
        },

        /**
         * Pixel ratio use for the rendering. Default to window.devicePixelRatio.
         */
        pixelRatio: {
          get: () =>
            this.tracker
              ? this.tracker.pixelRatio
              : this.initTrackerOptions.pixelRatio,
          set: (newPixelRatio) => {
            if (this.tracker) {
              this.tracker.pixelRatio = newPixelRatio;
            } else {
              this.initTrackerOptions.pixelRatio = newPixelRatio;
            }
          },
        },

        /**
         * Options used by the constructor of the Tracker class.
         */
        initTrackerOptions: {
          value: initTrackerOptions,
          writable: false,
        },

        /**
         * If true, encapsulates the renderTrajectories calls in a requestAnimationFrame.
         */
        useRequestAnimationFrame: {
          default: false,
          writable: true,
        },
      });
    }

    /**
     * Initalize the Tracker.
     * @param {ol/Map~Map} map
     * @param {Object} options
     * @param {number} [options.width] Canvas's width.
     * @param {number} [options.height] Canvas's height.
     * @param {bool} [options.interpolate] Convert an EPSG:3857 coordinate to a canvas pixel (origin top-left).
     * @param {string} [options.hoverVehicleId] Id of the trajectory which is hovered.
     * @param {string} [options.selectedVehicleId] Id of the trajectory which is selected.
     * @param {function} [options.filter] Function use to filter the features displayed.
     * @param {function} [options.sort] Function use to sort the features displayed.
     * @param {function} [options.style] Function use to style the features displayed.
     */
    init(map, options = {}) {
      super.init(map);

      this.tracker = new Tracker({
        style: (trajectory, viewState) => this.style(trajectory, viewState),
        ...this.initTrackerOptions,
        ...options,
      });

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
     * Start the trajectories rendering.
     *
     * @param {Array<Number>} size Map's size: [width, height].
     * @param {number} zoom Map's zoom level.
     * @param {number} resolution Map's resolution.
     * @param {number} rotation Map's rotation.
     */
    start() {
      this.stop();
      this.tracker.setVisible(true);
      this.renderTrajectories();
      this.startUpdateTime();

      if (this.isClickActive) {
        this.onClick(this.onFeatureClick);
      }

      if (this.isHoverActive) {
        this.onHover(this.onFeatureHover);
      }
    }

    /**
     * Start the clock.
     * @private
     */
    startUpdateTime() {
      this.stopUpdateTime();
      this.updateTimeDelay = this.getRefreshTimeInMs();
      this.updateTimeInterval = setInterval(() => {
        // When live=true, we update the time with new Date();
        this.time = this.live
          ? new Date()
          : this.time.getTime() + this.updateTimeDelay * this.speed;
      }, this.updateTimeDelay);
    }

    /**
     * Stop the trajectories rendering.
     */
    stop() {
      this.stopUpdateTime();
      if (this.tracker) {
        this.tracker.setVisible(false);
        this.tracker.clear();
      }
    }

    /**
     * Stop the clock.
     * @private
     */
    stopUpdateTime() {
      if (this.updateTimeInterval) {
        clearInterval(this.updateTimeInterval);
      }
    }

    /**
     * Launch renderTrajectories. it avoids duplicating code in renderTrajectories method.
     *
     * @param {object} viewState The view state of the map.
     * @param {number[2]} viewState.center Center coordinate of the map in mercator coordinate.
     * @param {number[4]} viewState.extent Extent of the map in mercator coordinates.
     * @param {number[2]} viewState.size Size ([width, height]) of the canvas to render.
     * @param {number} [viewState.rotation = 0] Rotation of the map to render.
     * @param {number} viewState.resolution Resolution of the map to render.
     * @param {boolean} noInterpolate If true trajectories are not interpolated but
     *   drawn at the last known coordinate. Use this for performance optimization
     *   during map navigation.
     * @private
     */
    renderTrajectoriesInternal(viewState, noInterpolate) {
      if (!this.tracker) {
        return false;
      }

      const time = this.live ? Date.now() : this.time;

      this.tracker.renderTrajectories({ ...viewState, time }, noInterpolate);

      return true;
    }

    /**
     * Render the trajectories requesting an animation frame and cancelling the previous one.
     * This function must be overrided by children to provide the correct parameters.
     *
     * @param {object} viewState The view state of the map.
     * @param {number[2]} viewState.center Center coordinate of the map in mercator coordinate.
     * @param {number[4]} viewState.extent Extent of the map in mercator coordinates.
     * @param {number[2]} viewState.size Size ([width, height]) of the canvas to render.
     * @param {number} [viewState.rotation = 0] Rotation of the map to render.
     * @param {number} viewState.resolution Resolution of the map to render.
     * @param {boolean} noInterpolate If true trajectories are not interpolated but
     *   drawn at the last known coordinate. Use this for performance optimization
     *   during map navigation.
     * @private
     */
    renderTrajectories(viewState, noInterpolate) {
      if (this.requestId) {
        cancelAnimationFrame(this.requestId);
      }

      if (this.useRequestAnimationFrame) {
        this.requestId = requestAnimationFrame(() => {
          this.renderTrajectoriesInternal(viewState, noInterpolate);
        });
      } else {
        this.renderTrajectoriesInternal(viewState, noInterpolate);
      }
    }

    /**
     * Get vehicle.
     * @param {function} filterFc A function use to filter results.
     * @returns {Array<Object>} Array of vehicle.
     */
    getVehicle(filterFc) {
      return this.tracker.getTrajectories().filter(filterFc);
    }

    /**
     * Returns an array of vehicles located at the given coordinates and resolution.
     *
     * @param {number[2]} coordinate A coordinate ([x,y]).
     * @param {number} [resolution=1] The resolution of the map.
     * @param {number} [nb=Infinity] The max number of vehicles to return.
     * @returns {Array<ol/Feature~Feature>} Array of vehicle.
     */
    getVehiclesAtCoordinate(coordinate, resolution = 1, nb = Infinity) {
      const ext = buffer(
        [...coordinate, ...coordinate],
        this.hitTolerance * resolution,
      );
      const trajectories = this.tracker.getTrajectories();
      const vehicles = [];
      for (let i = 0; i < trajectories.length; i += 1) {
        if (
          trajectories[i].coordinate &&
          containsCoordinate(ext, trajectories[i].coordinate)
        ) {
          vehicles.push(trajectories[i]);
        }
        if (vehicles.length === nb) {
          break;
        }
      }

      return vehicles;
    }

    /**
     * Request feature information for a given coordinate.
     *
     * @param {ol/coordinate~Coordinate} coordinate Coordinate.
     * @param {Object} options Options See child classes to see which options are supported.
     * @param {number} [options.resolution=1] The resolution of the map.
     * @param {number} [options.nb=Infinity] The max number of vehicles to return.
     * @returns {Promise<{layer: Layer, features: ol/Feature~Feature[], coordinate: number[2]}} Promise with features, layer and coordinate.
     */
    getFeatureInfoAtCoordinate(coordinate, options = {}) {
      const { resolution, nb } = options;

      const vehicles = this.getVehiclesAtCoordinate(coordinate, resolution, nb);

      return Promise.resolve({
        layer: this,
        features: vehicles.map((vehicle) => {
          const feature = new Feature({
            geometry: vehicle.geometry,
          });
          feature.setProperties({ ...vehicle });
          return feature;
        }),
        coordinate,
      });
    }

    /**
     * Define beahvior when a vehicle is clicked
     * To be defined in child classes.
     * @private
     * @inheritdoc
     */
    onFeatureClick() {}

    /**
     * Define behavior when a vehicle is hovered
     * To be defined in child classes.
     * @private
     * @inheritdoc
     */
    onFeatureHover() {}

    /**
     * Get the duration before the next update depending on zoom level.
     * @private
     * @param {number} zoom
     */
    getRefreshTimeInMs(zoom) {
      const roundedZoom = Math.round(zoom);
      const timeStep = timeSteps[roundedZoom] || 25;
      const nextTick = Math.max(25, timeStep / this.speed);
      return nextTick;
    }

    /**
     * @private
     */
    defaultStyle(trajectory) {
      const { id: text } = trajectory;
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
