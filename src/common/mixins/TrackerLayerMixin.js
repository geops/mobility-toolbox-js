/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { buffer, containsCoordinate } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import qs from 'query-string';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import Tracker from '../Tracker';
import { timeSteps } from '../trackerConfig';
import createFilters from '../utils/createTrackerFilters';
import { delayTrackerStyle } from '../utils';

/* Permalink parameter used to filters vehicles */
const LINE_FILTER = 'publishedlinename';
const ROUTE_FILTER = 'tripnumber';
const OPERATOR_FILTER = 'operator';
const VEHICLETYPE_FILTER = 'vehicletype';

/**
 * TrackerLayerInterface.
 *
 * @classproperty {string} hoverVehicleId - Id of the hovered vehicle.
 * @classproperty {string} selectedVehicleId - Id of the selected vehicle.
 * @classproperty {number} pixelRatio - Pixel ratio use to render the trajectories. Default to window.devicePixelRatio.
 * @classproperty {boolean} live - If true, the layer will always use Date.now() to render trajectories. Default to true.
 * @classproperty {boolean} useRequestAnimationFrame - If true, encapsulates the renderTrajectories calls in a requestAnimationFrame. Experimental.
 * @classproperty {boolean} useThrottle - If true, encapsulates the renderTrajectories calls in a throttle function. Experimental.
 * @classproperty {boolean} useDebounce - If true, encapsulates the renderTrajectories calls in a debounce function. Experimental.
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
   */
  startUpdateTime() {}

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
   * @return {Array<ol/Feature~Feature>} Array of vehicles.
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
      this.renderTrajectoriesInternal =
        this.renderTrajectoriesInternal.bind(this);

      this.throttleRenderTrajectories = throttle(
        this.renderTrajectoriesInternal,
        50,
        { leading: false, trailing: true },
      );

      this.debounceRenderTrajectories = debounce(
        this.renderTrajectoriesInternal,
        50,
        { leading: true, trailing: true, maxWait: 5000 },
      );
    }

    /**
     * Define layer's properties.
     *
     * @ignore
     */
    defineProperties(options) {
      // Tracker options use to build the tracker.
      let { regexPublishedLineName, publishedLineName, tripNumber, operator, vehicleType } =
        options;
      const {
        style,
        speed,
        pixelRatio,
        hoverVehicleId,
        selectedVehicleId,
        filter,
        sort,
        time,
        live,
      } = options;

      const initTrackerOptions = {
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
          value: filter,
          writable: true,
        },

        /**
         * Function to sort the vehicles to display.
         */
        sort: {
          value: sort,
          writable: true,
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
          value: {},
          writable: true,
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
          value: hoverVehicleId,
          writable: true,
        },

        /**
         * Id of the selected vehicle.
         */
        selectedVehicleId: {
          value: selectedVehicleId,
          writable: true,
        },

        /**
         * Id of the selected vehicle.
         */
        pixelRatio: {
          value: pixelRatio || window.devicePixelRatio || 1,
          writable: true,
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
          value: options.useRequestAnimationFrame || false,
          writable: true,
        },

        /**
         * If true, encapsulates the renderTrajectories calls in a throttle function. Default to true.
         */
        useThrottle: {
          value: options.useThrottle || true,
          writable: true,
        },

        /**
         * If true, encapsulates the renderTrajectories calls in a debounce function.
         */
        useDebounce: {
          value: options.useDebounce || false,
          writable: true,
        },

        /**
         * Filter properties used in combination with permalink parameters.
         */
        publishedLineName: {
          get: () => publishedLineName,
          set: (newPublishedLineName) => {
            publishedLineName = newPublishedLineName;
            this.updateFilters();
          },
        },
        tripNumber: {
          get: () => tripNumber,
          set: (newTripNumber) => {
            tripNumber = newTripNumber;
            this.updateFilters();
          },
        },
        operator: {
          get: () => operator,
          set: (newOperator) => {
            operator = newOperator;
            this.updateFilters();
          },
        },
        vehicleType: {
          get: () => vehicleType,
          set: (newVehicleType) => {
            vehicleType = newVehicleType;
            this.updateFilters();
          },
        },
        regexPublishedLineName: {
          get: () => regexPublishedLineName,
          set: (newRegex) => {
            regexPublishedLineName = newRegex;
            this.updateFilters();
          },
        },

        /**
         * Style properties.
         */
        delayDisplay: {
          value: options.delayDisplay || 300000,
          writable: true,
        },
        delayOutlineColor: {
          value: options.delayOutlineColor || '#000000',
          writable: true,
        },
        useDelayStyle: {
          value: options.useDelayStyle || false,
          writable: true,
        },

        /**
         * Debug properties.
         */
        // Not used anymore, but could be useful for debugging.
        // showVehicleTraj: {
        //   value:
        //     options.showVehicleTraj !== undefined
        //       ? options.showVehicleTraj
        //       : true,
        //   writable: true,
        // },
      });

      // When we use the delay style we want to display delayed train on top by default
      if (this.useDelayStyle && !this.sort) {
        this.sort = (traj1, traj2) => {
          const props1 = traj1.properties;
          const props2 = traj2.properties;

          if (props1.delay === null && props2.delay !== null) {
            return 1;
          }
          if (props2.delay === null && props1.delay !== null) {
            return -1;
          }

          // We put cancelled train inbetween green and yellow trains
          // >=180000ms corresponds to yellow train
          if (props1.cancelled && !props2.cancelled) {
            return props2.delay < 180000 ? -1 : 1;
          }
          if (props2.cancelled && !props1.cancelled) {
            return props1.delay < 180000 ? 1 : -1;
          }
          return props2.delay - props1.delay;
        };
      }

      // Update filter function based on convenient properties
      this.updateFilters();
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
        style: (...args) => this.style(...args),
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
        const { canvas } = this.tracker;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
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
        const { canvas } = this.tracker;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
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

      const trajectories = Object.values(this.trajectories);

      // console.time('sort');
      if (this.sort) {
        trajectories.sort(this.sort);
      }
      if(this.filter) {
        trajectories.filter(this.filter);
      }

      // console.timeEnd('sort');
      window.trajectories = trajectories;

      // console.time('render');
      this.renderState = this.tracker.renderTrajectories(
        trajectories,
        { ...viewState, pixelRatio: this.pixelRatio, time },
        {
          noInterpolate,
          hoverVehicleId: this.hoverVehicleId,
          selectedVehicleId: this.selectedVehicleId,
          iconScale: this.iconScale,
          delayDisplay: this.delayDisplay,
          delayOutlineColor: this.delayOutlineColor,
          useDelayStyle: this.useDelayStyle,
        },
      );

      // console.timeEnd('render');
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
        this.requestId = null;
      }

      if (!noInterpolate && this.useRequestAnimationFrame) {
        this.requestId = requestAnimationFrame(() => {
          this.renderTrajectoriesInternal(viewState, noInterpolate);
        });
      } else if (!noInterpolate && this.useDebounce) {
        this.debounceRenderTrajectories(viewState, noInterpolate);
      } else if (!noInterpolate && this.useThrottle) {
        this.throttleRenderTrajectories(viewState, noInterpolate);
      } else {
        this.renderTrajectoriesInternal(viewState, noInterpolate);
      }
    }

    /**
     * Get vehicle.
     * @param {function} filterFc A function use to filter results.
     * @return {Array<Object>} Array of vehicle.
     */
    getVehicle(filterFc) {
      return Object.values(this.trajectories).filter(filterFc);
    }

    /**
     * Returns an array of vehicles located at the given coordinates and resolution.
     *
     * @param {number[2]} coordinate A coordinate ([x,y]).
     * @param {number} [resolution=1] The resolution of the map.
     * @param {number} [nb=Infinity] The max number of vehicles to return.
     * @return {Array<ol/Feature~Feature>} Array of vehicle.
     */
    getVehiclesAtCoordinate(coordinate, resolution = 1, nb = Infinity) {
      const ext = buffer(
        [...coordinate, ...coordinate],
        this.hitTolerance * resolution,
      );
      const trajectories = Object.values(this.trajectories);
      const vehicles = [];
      for (let i = 0; i < trajectories.length; i += 1) {
        if (
          trajectories[i].properties.coordinate &&
          containsCoordinate(ext, trajectories[i].properties.coordinate)
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
     * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate.
     */
    getFeatureInfoAtCoordinate(coordinate, options = {}) {
      const { resolution, nb } = options;

      const vehicles = this.getVehiclesAtCoordinate(coordinate, resolution, nb);

      return Promise.resolve({
        layer: this,
        features: vehicles.map((vehicle) => this.format.readFeature(vehicle)),
        coordinate,
      });
    }

    /**
     * On zoomend we adjust the time interval of the update of vehicles positions.
     *
     * @param evt Event that triggered the function.
     * @private
     */
    // eslint-disable-next-line no-unused-vars
    onZoomEnd(evt) {
      this.startUpdateTime();
    }

    /**
     * Define beahvior when a vehicle is clicked
     * To be defined in child classes.
     *
     * @private
     * @override
     */
    onFeatureClick() {}

    /**
     * Define behavior when a vehicle is hovered
     * To be defined in child classes.
     *
     * @private
     * @override
     */
    onFeatureHover() {}

    /**
     * Get the duration before the next update depending on zoom level.
     *
     * @private
     * @param {number} zoom
     */
    getRefreshTimeInMs(zoom) {
      const roundedZoom = Math.round(zoom);
      const timeStep = timeSteps[roundedZoom] || 25;
      const nextTick = Math.max(25, timeStep / this.speed);
      const nextThrottleTick = Math.min(nextTick, 500);
      // TODO: see if this should go elsewhere.
      if (this.useThrottle) {
        this.throttleRenderTrajectories = throttle(
          this.renderTrajectoriesInternal,
          nextThrottleTick,
          { leading: true, trailing: true },
        );
      } else if (this.useDebounce) {
        this.debounceRenderTrajectories = debounce(
          this.renderTrajectoriesInternal,
          nextThrottleTick,
          { leading: true, trailing: true, maxWait: 5000 },
        );
      }
      if (this.api?.buffer) {
        const [, size] = this.api.buffer;
        this.api.buffer = [nextThrottleTick, size];
      }
      return nextTick;
    }

    /**
     * Update filter provided by properties or permalink.
     */
    updateFilters() {
      // Setting filters from the permalink if no values defined by the layer.
      const parameters = qs.parse(window.location.search.toLowerCase());
      const publishedName = this.publishedLineName || parameters[LINE_FILTER];
      const tripNumber = this.tripNumber || parameters[ROUTE_FILTER];
      const operator = this.operator || parameters[OPERATOR_FILTER];
      const vehicleType = this.vehicleType || parameters[VEHICLETYPE_FILTER];
      const { regexPublishedLineName } = this;

      // Only overrides filter function if one of this property exists.
      if (publishedName || tripNumber || operator || vehicleType || regexPublishedLineName) {
        // filter is the property in TrackerLayerMixin.
        this.filter = createFilters(
          publishedName,
          tripNumber,
          operator,
          vehicleType,
          regexPublishedLineName,
        );
      }
    }

    /**
     * @private
     */
    defaultStyle(trajectory, viewState) {
      return delayTrackerStyle(trajectory, viewState, this);
    }
  };

export default TrackerLayerMixin;
