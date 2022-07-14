/* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
/* eslint-disable no-useless-constructor,@typescript-eslint/no-useless-constructor */
/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { buffer, containsCoordinate, intersects } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import GeoJSON from 'ol/format/GeoJSON';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { fromLonLat } from 'ol/proj';
import realtimeDefaultStyle from '../styles/realtimeDefaultStyle';
import { RealtimeAPI, RealtimeModes } from '../../api';
import renderTrajectories from '../utils/renderTrajectories';
import * as trackerConfig from '../utils/trackerConfig';

/**
 * RealtimeLayerInterface.
 */
export class RealtimeLayerInterface {
  /*
   * Constructor

   * @param {Object} options Layer options.
   * @param {string} options.url Realtime service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   * @param {boolean} [options.debug=false] Display additional debug informations.
   * @param {RealtimeMode} [options.mode=RealtimeMode.TOPOGRAPHIC] Realtime's Mode.
   * @param {number} [options.minZoomInterpolation=8] Minimal zoom when trains positions start to be interpolated.
   * @param {number} [options.minZoomNonTrain=9] Minimal zoom when non trains vehicles are allowed to be displayed.
   */
  constructor(options = {}) {}

  /**
   * Initialize the layer subscribing to the Realtime api.
   *
   * @param {ol/Map~Map} map
   */
  attachToMap(map) {}

  /**
   * Terminate the layer unsubscribing to the Realtime api.
   */
  detachFromMap() {}

  /**
   * Start the clock.
   */
  start() {}

  /**
   * Stop the clock.
   */
  stop() {}

  /**
   * Set the Realtime api's bbox.
   *
   * @param {Array<number>} extent  Extent to request, [minX, minY, maxX, maxY, zoom].
   * @param {number} zoom  Zoom level to request. Must be an integer.
   */
  setBbox(extent, zoom) {}

  /**
   * Set the Realtime api's mode.
   *
   * @param {RealtimeMode} mode  Realtime mode
   */
  setMode(mode) {}

  /**
   * Request the stopSequence and the fullTrajectory informations for a vehicle.
   *
   * @param {string} id The vehicle identifier (the  train_id property).
   * @param {RealtimeMode} mode The mode to request. If not defined, the layer´s mode propetrty will be used.
   * @return {Promise<{stopSequence: StopSequence, fullTrajectory: FullTrajectory>} A promise that will be resolved with the trajectory informations.
   */
  getTrajectoryInfos(id, mode) {}
}

/**
 * Mixin for RealtimeLayerInterface.
 *
 * @param {Class} Base A class to extend with {RealtimeLayerInterface} functionnalities.
 * @return {Class}  A class that implements {RealtimeLayerInterface} class and extends Base;
 * @private
 */
const RealtimeLayerMixin = (Base) =>
  class extends Base {
    constructor(options = {}) {
      super({
        hitTolerance: 10,
        ...options,
      });

      this.debug = options.debug;
      this.mode = options.mode || RealtimeModes.TOPOGRAPHIC;
      this.api = options.api || new RealtimeAPI(options);
      this.tenant = options.tenant || ''; // sbb,sbh or sbm
      this.minZoomNonTrain = options.minZoomNonTrain || 9; // Min zoom level from which non trains are allowed to be displayed. Min value is 9 (as configured by the server
      this.minZoomInterpolation = options.minZoomInterpolation || 8; // Min zoom level from which trains positions are not interpolated.
      this.format = new GeoJSON();
      this.generalizationLevelByZoom = options.generalizationLevelByZoom || [
        5, 5, 5, 5, 5, 5, 5, 5, 10, 30, 30, 100, 100, 100,
      ];
      this.getGeneralizationLevelByZoom = (zoom) => {
        return (
          (options.getGeneralizationLevelByZoom &&
            options.getGeneralizationLevelByZoom(
              zoom,
              this.generalizationLevelByZoom,
            )) ||
          this.generalizationLevelByZoom[zoom]
        );
      };

      this.renderTimeIntervalByZoom = options.renderTimeIntervalByZoom || [
        100000, 50000, 40000, 30000, 20000, 15000, 10000, 5000, 2000, 1000, 400,
        300, 250, 180, 90, 60, 50, 50, 50, 50, 50,
      ];

      this.getRenderTimeIntervalByZoom = (zoom) => {
        return (
          (options.getRenderTimeIntervalByZoom &&
            options.getRenderTimeIntervalByZoom(
              zoom,
              this.renderTimeIntervalByZoom,
            )) ||
          this.renderTimeIntervalByZoom[zoom]
        );
      };

      // This property will call api.setBbox on each movend event
      this.isUpdateBboxOnMoveEnd = options.isUpdateBboxOnMoveEnd !== false;

      // Define throttling and debounce render function
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

      // Bind callbacks
      this.onFeatureHover = this.onFeatureHover.bind(this);
      this.onFeatureClick = this.onFeatureClick.bind(this);
      this.renderTrajectoriesInternal =
        this.renderTrajectoriesInternal.bind(this);
      this.onTrajectoryMessage = this.onTrajectoryMessage.bind(this);
      this.onDeleteTrajectoryMessage =
        this.onDeleteTrajectoryMessage.bind(this);
      this.onDocumentVisibilityChange =
        this.onDocumentVisibilityChange.bind(this);
    }

    /**
     * Define layer's properties.
     *
     * @ignore
     */
    defineProperties(options) {
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
        canvas,
        styleOptions,
      } = options;

      let currSpeed = speed || 1;
      let currTime = time || new Date();

      super.defineProperties(options);

      Object.defineProperties(this, {
        isTrackerLayer: { value: true },

        canvas: {
          value: canvas || document.createElement('canvas'),
        },

        /**
         * Style function used to render a vehicle.
         */
        style: {
          value: style || realtimeDefaultStyle,
        },

        /**
         * Custom options to pass as last parameter of the style function.
         */
        styleOptions: {
          value: { ...trackerConfig, ...(styleOptions || {}) },
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
          value:
            pixelRatio ||
            (typeof window !== 'undefined' ? window.devicePixelRatio : 1),
          writable: true,
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
    }

    attachToMap(map) {
      super.attachToMap(map);

      // If the layer is visible we start  the rendering clock
      if (this.visible) {
        this.start();
      }

      // On change of visibility we start/stop the rendering clock
      this.visibilityRef = this.on('change:visible', (evt) => {
        if (evt.target.visible) {
          this.start();
        } else {
          this.stop();
        }
      });

      // To avoid browser hanging when the tab is not visible for a certain amount of time,
      // We stop the rendering and the websocket when hide and start again when show.
      document.addEventListener(
        'visibilitychange',
        this.onDocumentVisibilityChange,
      );
    }

    detachFromMap() {
      document.removeEventListener(
        'visibilitychange',
        this.onDocumentVisibilityChange,
      );

      this.stop();
      unByKey(this.visibilityRef);
      const context = this.canvas.getContext('2d');
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      super.detachFromMap();
    }

    start() {
      this.stop();
      this.renderTrajectories();
      this.startUpdateTime();

      this.api.open();
      this.api.subscribeTrajectory(
        this.mode,
        this.onTrajectoryMessage,
        this.isUpdateBboxOnMoveEnd,
      );
      this.api.subscribeDeletedVehicles(
        this.mode,
        this.onDeleteTrajectoryMessage,
        this.isUpdateBboxOnMoveEnd,
      );

      if (this.isUpdateBboxOnMoveEnd) {
        // Update the bbox on each move end
        this.setBbox();
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

    stop() {
      this.api.unsubscribeTrajectory(this.onTrajectoryMessage);
      this.api.unsubscribeDeletedVehicles(this.onDeleteTrajectoryMessage);
      this.api.close();
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
      const time = this.live ? Date.now() : this.time;

      const trajectories = Object.values(this.trajectories);

      // console.time('sort');
      if (this.sort) {
        trajectories.sort(this.sort);
      }
      // console.timeEnd('sort');

      // console.time('render');
      this.renderState = renderTrajectories(
        this.canvas,
        trajectories,
        this.style,
        { ...viewState, pixelRatio: this.pixelRatio, time },
        {
          noInterpolate:
            viewState.zoom < this.minZoomInterpolation ? true : noInterpolate,
          hoverVehicleId: this.hoverVehicleId,
          selectedVehicleId: this.selectedVehicleId,
          ...this.styleOptions,
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

    setBbox(extent, zoom) {
      // Clean trajectories before sending the new bbox
      // Purge trajectories:
      // - which are outside the extent
      // - when it's bus and zoom level is too low for them
      const keys = Object.keys(this.trajectories);
      for (let i = keys.length - 1; i >= 0; i -= 1) {
        this.purgeTrajectory(this.trajectories[keys[i]], extent, zoom);
      }

      const bbox = [...extent];

      if (this.isUpdateBboxOnMoveEnd) {
        bbox.push(zoom);

        if (this.tenant) {
          bbox.push(`tenant=${this.tenant}`);
        }

        /* @ignore */
        this.generalizationLevel = this.getGeneralizationLevelByZoom(zoom);
        if (this.generalizationLevel) {
          bbox.push(`gen=${this.generalizationLevel}`);
        }
      }

      this.api.bbox = bbox;
    }

    setMode(mode) {
      if (this.mode === mode) {
        return;
      }
      this.mode = mode;
      this.api.subscribeTrajectory(
        this.mode,
        this.onTrajectoryMessage,
        this.isUpdateBboxOnMoveEnd,
      );
      this.api.subscribeDeletedVehicles(
        this.mode,
        this.onDeleteTrajectoryMessage,
        this.isUpdateBboxOnMoveEnd,
      );
    }

    /**
     * Get the duration before the next update depending on zoom level.
     *
     * @private
     * @param {number} zoom
     */
    getRefreshTimeInMs(zoom) {
      const roundedZoom = Math.round(zoom);
      const timeStep = this.getRenderTimeIntervalByZoom(roundedZoom) || 25;
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
     * Get vehicle.
     * @param {function} filterFc A function use to filter results.
     * @return {Array<Object>} Array of vehicle.
     */
    getVehicle(filterFc) {
      return Object.values(this.trajectories).filter(filterFc);
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
      const ext = buffer(
        [...coordinate, ...coordinate],
        this.hitTolerance * resolution,
      );
      let trajectories = Object.values(this.trajectories);

      if (this.sort) {
        trajectories = trajectories.sort(this.sort);
      }

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

      return Promise.resolve({
        layer: this,
        features: vehicles.map((vehicle) => this.format.readFeature(vehicle)),
        coordinate,
      });
    }

    /**
     * Request the stopSequence and the fullTrajectory informations for a vehicle.
     *
     * @param {string} id The vehicle identifier (the  train_id property).
     * @return {Promise<{stopSequence: StopSequence, fullTrajectory: FullTrajectory>} A promise that will be resolved with the trajectory informations.
     */
    getTrajectoryInfos(id) {
      // When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
      // Then we combine them in one response and send them to inherited layers.
      const promises = [
        this.api.getStopSequence(id, this.mode),
        this.api.getFullTrajectory(id, this.mode, this.generalizationLevel),
      ];

      return Promise.all(promises).then(([stopSequence, fullTrajectory]) => {
        const response = {
          stopSequence,
          fullTrajectory,
        };
        return response;
      });
    }

    /**
     * Determine if the trajectory is useless and should be removed from the list or not.
     * By default, this function exclude vehicles:
     *  - that have their trajectory outside the current extent and
     *  - that are not a train and zoom level is lower than layer's minZoomNonTrain property.
     *
     * @param {RealtimeTrajectory} trajectory
     * @param {Array<number>} extent
     * @param {number} zoom
     * @return {boolean} if the trajectory must be displayed or not.
     * @ignore
     */
    purgeTrajectory(trajectory, extent, zoom) {
      const { type, bounds, train_id: id } = trajectory.properties;
      if (
        !intersects(extent, bounds) ||
        (type !== 'rail' && zoom < (this.minZoomNonTrain || 9))
      ) {
        this.removeTrajectory(id);
        return true;
      }
      return false;
    }

    /**
     * Add a trajectory.
     * @param {RealtimeTrajectory} trajectory The trajectory to add.
     * @private
     */
    addTrajectory(trajectory) {
      if (this.filter && !this.filter(trajectory)) {
        return;
      }
      this.trajectories[trajectory.properties.train_id] = trajectory;
      this.renderTrajectories();
    }

    removeTrajectory(id) {
      delete this.trajectories[id];
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

    onDocumentVisibilityChange() {
      if (!this.visible) {
        return;
      }
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    }

    /**
     * Callback on websocket's trajectory channel events.
     * It adds a trajectory to the list.
     *
     * @private
     */
    onTrajectoryMessage(data) {
      if (!data.content) {
        return;
      }
      const trajectory = data.content;

      const {
        geometry,
        properties: {
          train_id: id,
          time_since_update: timeSinceUpdate,
          raw_coordinates: rawCoordinates,
        },
      } = trajectory;

      // ignore old events [SBAHNM-97]
      if (timeSinceUpdate < 0) {
        return;
      }

      // console.time(`onTrajectoryMessage${data.content.properties.train_id}`);
      if (this.purgeTrajectory(trajectory)) {
        return;
      }

      if (
        this.debug &&
        this.mode === RealtimeModes.TOPOGRAPHIC &&
        rawCoordinates
      ) {
        trajectory.properties.olGeometry = {
          type: 'Point',
          coordinates: fromLonLat(
            rawCoordinates,
            this.map.getView().getProjection(),
          ),
        };
      } else {
        trajectory.properties.olGeometry = this.format.readGeometry(geometry);
      }

      // TODO Make sure the timeOffset is useful. May be we can remove it.
      trajectory.properties.timeOffset = Date.now() - data.timestamp;
      this.addTrajectory(trajectory);
    }

    /**
     * Callback on websocket's deleted_vehicles channel events.
     * It removes the trajectory from the list.
     *
     * @private
     * @override
     */
    onDeleteTrajectoryMessage(data) {
      if (!data.content) {
        return;
      }

      this.removeTrajectory(data.content);
    }

    /**
     * Callback when user moves the mouse/pointer over the map.
     * It sets the layer's hoverVehicleId property with the current hovered vehicle's id.
     *
     * @private
     * @override
     */
    onFeatureHover(features, layer, coordinate) {
      const [feature] = features;
      let id = null;
      if (feature) {
        id = feature.get('train_id');
      }
      if (this.hoverVehicleId !== id) {
        /** @ignore */
        this.hoverVehicleId = id;
        this.renderTrajectories(true);
      }
    }

    /**
     * Callback when user clicks on the map.
     * It sets the layer's selectedVehicleId property with the current selected vehicle's id.
     *
     * @private
     * @override
     */
    onFeatureClick(features, layer, coordinate) {
      const [feature] = features;
      let id = null;
      if (feature) {
        id = feature.get('train_id');
      }
      if (this.selectedVehicleId !== id) {
        /** @ignore */
        this.selectedVehicleId = id;
        this.selectedVehicle = feature;
        this.renderTrajectories(true);
      }
    }
  };

export default RealtimeLayerMixin;
