/* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
/* eslint-disable no-useless-constructor,@typescript-eslint/no-useless-constructor */
/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { Coordinate } from 'ol/coordinate';
import { EventsKey } from 'ol/events';
/* eslint-disable max-classes-per-file */
import { buffer, containsCoordinate, intersects } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import { Options } from 'ol/layer/Layer';
import { unByKey } from 'ol/Observable';
import { fromLonLat } from 'ol/proj';

import { RealtimeAPI, RealtimeModes } from '../../api';
import { WebSocketAPIMessageEventData } from '../../api/WebSocketAPI';
import {
  AnyCanvas,
  AnyLayer,
  AnyLayerable,
  AnyLayerClass,
  AnyMap,
  AnyRealtimeLayer,
  LayerGetFeatureInfoOptions,
  LayerGetFeatureInfoResponse,
  RealtimeBbox,
  RealtimeGeneralizationLevel,
  RealtimeMode,
  RealtimeMot,
  RealtimeRenderState,
  RealtimeStyleFunction,
  RealtimeStyleOptions,
  RealtimeTenant,
  RealtimeTrainId,
  RealtimeTrajectory,
  ViewState,
} from '../../types';
import realtimeDefaultStyle from '../styles/realtimeDefaultStyle';
import { FilterFunction, SortFunction } from '../typedefs';
import * as realtimeConfig from '../utils/realtimeConfig';
import renderTrajectories from '../utils/renderTrajectories';

export type RealtimeLayerMixinOptions = {
  api?: RealtimeAPI;
  apiKey?: string;
  bbox?: (number | string)[];
  bboxParameters?: Record<
    string,
    boolean | boolean[] | number | number[] | string | string[]
  >;
  buffer?: number[];
  canvas?: HTMLCanvasElement;
  debug?: boolean;
  filter?: FilterFunction;
  generalizationLevelByZoom?: RealtimeGeneralizationLevel[];
  getGeneralizationLevelByZoom?: (
    zoom: number,
    generalizationLevelByZoom: RealtimeGeneralizationLevel[],
  ) => RealtimeGeneralizationLevel;
  getMotsByZoom?: (zoom: number, motsByZoom: RealtimeMot[][]) => RealtimeMot[];
  getRenderTimeIntervalByZoom?: (
    zoom: number,
    renderTimeIntervalByZoom: number[],
  ) => number;
  hoverVehicleId?: RealtimeTrainId;
  isUpdateBboxOnMoveEnd?: boolean;
  live?: boolean;
  minZoomInterpolation?: number;
  mode?: RealtimeMode;
  motsByZoom?: RealtimeMot[][];
  onStart?: (realtimeLayer: AnyRealtimeLayer) => void;
  onStop?: (realtimeLayer: AnyRealtimeLayer) => void;
  pingIntervalMs?: number;
  pixelRatio?: number;
  prefix?: string;
  renderTimeIntervalByZoom?: number[];
  selectedVehicleId?: RealtimeTrainId;
  sort?: SortFunction;
  speed?: number;
  style?: RealtimeStyleFunction;

  styleOptions?: RealtimeStyleOptions;
  tenant?: RealtimeTenant;
  time?: number;
  // From RealtimeAPIOptions
  url?: string;
  useDebounce?: boolean;
  useRequestAnimationFrame?: boolean;
  useThrottle?: boolean;
} & Options;

/**
 * RealtimeLayerInterface.
 * @private
 */
export class RealtimeLayerInterface {
  /**
   * Request the stopSequence and the fullTrajectory informations for a vehicle.
   *
   * @param {string} id The vehicle identifier (the  train_id property).
   * @param {RealtimeMode} mode The mode to request. If not defined, the layer´s mode propetrty will be used.
   * @return {Promise<{stopSequence: RealtimeStopSequence, fullTrajectory: RealtimeFullTrajectory>} A promise that will be resolved with the trajectory informations.
   */
  getTrajectoryInfos(id: string, mode: RealtimeMode) {}

  /**
   * Render the trajectories
   */
  renderTrajectories() {}

  /**
   * Set the Realtime api's bbox.
   *
   * @param {Array<number>} extent  Extent to request, [minX, minY, maxX, maxY].
   * @param {number} zoom  Zoom level to request. Must be an integer.
   */
  setBbox(extent: [number, number, number, number], zoom: number) {}

  /**
   * Start the clock.
   */
  start() {}

  /**
   * Stop the clock.
   */
  stop() {}
}

/**
 * Mixin for RealtimeLayerInterface.
 *
 * @param {Class} Base A class to extend with {RealtimeLayerInterface} functionnalities.
 * @return {Class}  A class that implements {RealtimeLayerInterface} class and extends Base;
 * @private
 */
function RealtimeLayerMixin<T extends AnyLayerable>(Base: T) {
  // @ts-expect-error
  return class Mixin extends Base {
    api: RealtimeAPI;

    bboxParameters?: Record<
      string,
      boolean | boolean[] | number | number[] | string | string[]
    >;

    canvas?: AnyCanvas;

    debounceRenderTrajectories: (
      viewState: ViewState,
      noInterpolate?: boolean,
    ) => void;

    debug: boolean;

    filter?: FilterFunction;

    format: GeoJSON;

    generalizationLevel?: RealtimeGeneralizationLevel;

    generalizationLevelByZoom: RealtimeGeneralizationLevel[];

    getGeneralizationLevelByZoom: (zoom: number) => RealtimeGeneralizationLevel;

    getMotsByZoom: (zoom: number) => RealtimeMot[];

    getRenderTimeIntervalByZoom: (zoom: number) => number;

    hoverVehicleId?: RealtimeTrainId;

    isUpdateBboxOnMoveEnd: boolean;

    live?: boolean;

    minZoomInterpolation: number;

    mode: RealtimeMode;

    mots?: RealtimeMot[];

    motsByZoom: RealtimeMot[][];

    onStart?: (realtimeLayer: AnyLayer) => void;

    onStop?: (realtimeLayer: AnyLayer) => void;

    pixelRatio?: number;

    renderState?: RealtimeRenderState;

    renderTimeIntervalByZoom: number[];

    requestId?: number;

    selectedVehicle!: RealtimeTrajectory;

    selectedVehicleId?: RealtimeTrainId;

    sort?: SortFunction;

    speed?: number;

    style?: RealtimeStyleFunction;

    styleOptions?: RealtimeStyleOptions;

    tenant: RealtimeTenant;

    throttleRenderTrajectories: (
      viewState: ViewState,
      noInterpolate?: boolean,
    ) => void;

    time?: Date;

    trajectories?: Record<RealtimeTrainId, RealtimeTrajectory>;

    updateTimeDelay?: number;

    updateTimeInterval?: number;

    useDebounce?: boolean;

    useRequestAnimationFrame?: boolean;

    useThrottle?: boolean;

    visibilityRef!: EventsKey;

    constructor(options: RealtimeLayerMixinOptions) {
      super({
        hitTolerance: 10,
        ...options,
      });
      this.defineProperties(options);

      this.debug = options.debug || false;
      this.mode = options.mode || RealtimeModes.TOPOGRAPHIC;
      this.api = options.api || new RealtimeAPI(options);
      this.tenant = options.tenant || ''; // sbb,sbh or sbm
      this.minZoomInterpolation = options.minZoomInterpolation || 8; // Min zoom level from which trains positions are not interpolated.
      this.format = new GeoJSON();
      this.onStart = options.onStart;
      this.onStop = options.onStop;

      // Server will block non train before zoom 9
      this.motsByZoom = options.motsByZoom || [
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_ONLY_RAIL,
        realtimeConfig.MOTS_WITHOUT_CABLE,
        realtimeConfig.MOTS_WITHOUT_CABLE,
      ];

      this.getMotsByZoom = (zoom) => {
        if (options.getMotsByZoom) {
          return options.getMotsByZoom(zoom, this.motsByZoom);
        }
        return this.motsByZoom[zoom];
      };

      // Generalization levels by zoom
      this.generalizationLevelByZoom = options.generalizationLevelByZoom || [];
      this.getGeneralizationLevelByZoom = (zoom) => {
        if (options.getGeneralizationLevelByZoom) {
          return options.getGeneralizationLevelByZoom(
            zoom,
            this.generalizationLevelByZoom,
          );
        }
        return this.generalizationLevelByZoom[zoom];
      };

      // Render time interval by zoom
      this.renderTimeIntervalByZoom = options.renderTimeIntervalByZoom || [
        100000, 50000, 40000, 30000, 20000, 15000, 10000, 5000, 2000, 1000, 400,
        300, 250, 180, 90, 60, 50, 50, 50, 50, 50,
      ];

      this.getRenderTimeIntervalByZoom = (zoom) => {
        if (options.getRenderTimeIntervalByZoom) {
          return options.getRenderTimeIntervalByZoom(
            zoom,
            this.renderTimeIntervalByZoom,
          );
        }
        return this.renderTimeIntervalByZoom[zoom];
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
        { leading: true, maxWait: 5000, trailing: true },
      );

      // Bind callbacks
      // this.onFeatureHover = this.onFeatureHover.bind(this);
      // this.onFeatureClick = this.onFeatureClick.bind(this);
      this.renderTrajectoriesInternal =
        this.renderTrajectoriesInternal.bind(this);
      this.onTrajectoryMessage = this.onTrajectoryMessage.bind(this);
      this.onDeleteTrajectoryMessage =
        this.onDeleteTrajectoryMessage.bind(this);
      this.onDocumentVisibilityChange =
        this.onDocumentVisibilityChange.bind(this);
    }

    /**
     * Add a trajectory.
     * @param {RealtimeTrajectory} trajectory The trajectory to add.
     * @private
     */
    addTrajectory(trajectory: RealtimeTrajectory) {
      if (!this.trajectories) {
        this.trajectories = {};
      }
      const id = trajectory.properties.train_id;
      if (id !== undefined) {
        this.trajectories[id] = trajectory;
      }
      // @ts-expect-error  the parameter are set by subclasses
      this.renderTrajectories();
    }

    attachToMap(map: AnyMap) {
      super.attachToMap(map);

      // To avoid browser hanging when the tab is not visible for a certain amount of time,
      // We stop the rendering and the websocket when hide and start again when show.
      document.addEventListener(
        'visibilitychange',
        this.onDocumentVisibilityChange,
      );
    }

    /**
     * Define layer's properties.
     *
     * @private
     */
    defineProperties(options: RealtimeLayerMixinOptions) {
      (super.defineProperties || (() => {}))(options);
      const {
        bboxParameters,
        canvas,
        filter,
        hoverVehicleId,
        live,
        mode,
        pixelRatio,
        selectedVehicleId,
        sort,
        speed,
        style,
        styleOptions,
        time,
      } = options;
      let currCanvas = canvas;
      let currSpeed = speed || 1;
      let currTime = time || new Date();
      let currMode = mode || RealtimeModes.TOPOGRAPHIC;
      let currStyle = style || realtimeDefaultStyle;

      Object.defineProperties(this, {
        /**
         * Custom parameters to send on each BBOX request.
         */
        bboxParameters: {
          value: bboxParameters,
          writable: true,
        },

        canvas: {
          get: () => {
            if (!currCanvas) {
              currCanvas = document.createElement('canvas');
            }
            return currCanvas;
          },
          set: (cnvas: HTMLCanvasElement) => {
            currCanvas = cnvas;
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
         * Id of the hovered vehicle.
         */
        hoverVehicleId: {
          value: hoverVehicleId,
          writable: true,
        },

        isTrackerLayer: { value: true },

        /**
         * If true. The layer will always use Date.now() on the next tick to render the trajectories.
         * When true, setting the time property has no effect.
         */
        live: {
          value: live === false ? live : true,
          writable: true,
        },

        /**
         * Style function used to render a vehicle.
         */
        mode: {
          get: () => currMode,
          set: (newMode: RealtimeMode) => {
            if (newMode === currMode) {
              return;
            }
            currMode = newMode;
            if (this.api?.wsApi?.open) {
              this.stop();
              this.start();
            }
          },
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
         * Id of the selected vehicle.
         */
        selectedVehicleId: {
          value: selectedVehicleId,
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
         * Style function used to render a vehicle.
         */
        style: {
          get: () => currStyle,
          set: (newStyle: RealtimeStyleFunction) => {
            currStyle = newStyle;
            // @ts-expect-error   function without parameters is defined in subclasses
            this.renderTrajectories();
          },
        },

        /**
         * Custom options to pass as last parameter of the style function.
         */
        styleOptions: {
          value: { ...realtimeConfig, ...(styleOptions || {}) },
        },

        /**
         * Time used to display the trajectories. Can be a Date or a number in ms representing a Date.
         * If live property is true. The setter does nothing.
         */
        time: {
          get: () => currTime,
          set: (newTime) => {
            currTime = newTime?.getTime ? newTime : new Date(newTime);
            // @ts-expect-error   function without parameters is defined in subclasses
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
         * If true, encapsulates the renderTrajectories calls in a debounce function.
         */
        useDebounce: {
          value: options.useDebounce || false,
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
          value: options.useThrottle !== false,
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

    detachFromMap() {
      document.removeEventListener(
        'visibilitychange',
        this.onDocumentVisibilityChange,
      );

      this.stop();
      unByKey(this.visibilityRef);
      if (this.canvas) {
        const context = this.canvas.getContext('2d');
        if (context) {
          (context as CanvasRenderingContext2D).clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
          );
        }
        super.detachFromMap();
      }
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
    getFeatureInfoAtCoordinate(
      coordinate: Coordinate,
      options: LayerGetFeatureInfoOptions,
    ) {
      const { nb, resolution } = options;
      const ext = buffer(
        [...coordinate, ...coordinate],
        this.hitTolerance * resolution,
      );
      let trajectories = Object.values(this.trajectories || {});

      if (this.sort) {
        // @ts-expect-error good type must be defined
        trajectories = trajectories.sort(this.sort);
      }

      const vehicles = [];
      for (let i = 0; i < trajectories.length; i += 1) {
        // @ts-expect-error  coordinate is added by the RealtimeLayer
        const { coordinate: trajcoord } = trajectories[i].properties;
        if (trajcoord && containsCoordinate(ext, trajcoord)) {
          vehicles.push(trajectories[i]);
        }
        if (vehicles.length === nb) {
          break;
        }
      }

      return Promise.resolve({
        coordinate,
        features: vehicles.map((vehicle) => this.format.readFeature(vehicle)),
        layer: this,
      } as LayerGetFeatureInfoResponse);
    }

    /**
     * Get the duration before the next update depending on zoom level.
     *
     * @private
     * @param {number} zoom
     */
    getRefreshTimeInMs(zoom: number | undefined = 0): number {
      const roundedZoom = zoom !== undefined ? Math.round(zoom) : -1;
      const timeStep = this.getRenderTimeIntervalByZoom(roundedZoom) || 25;
      const nextTick = Math.max(25, timeStep / (this.speed || 1));
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
          { leading: true, maxWait: 5000, trailing: true },
        );
      }
      if (this.api?.buffer) {
        const [, size] = this.api.buffer;
        this.api.buffer = [nextThrottleTick, size];
      }
      return nextTick;
    }

    /**
     * Request the stopSequence and the fullTrajectory informations for a vehicle.
     *
     * @param {string} id The vehicle identifier (the  train_id property).
     * @return {Promise<{stopSequence: RealtimeStopSequence, fullTrajectory: RealtimeFullTrajectory>} A promise that will be resolved with the trajectory informations.
     */
    getTrajectoryInfos(id: RealtimeTrainId) {
      // When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
      // Then we combine them in one response and send them to inherited layers.
      const promises = [
        this.api.getStopSequence(id),
        this.api.getFullTrajectory(
          id,
          this.mode,
          this.getGeneralizationLevelByZoom(
            Math.floor(this.map?.getView()?.getZoom() || 0),
          ),
        ),
      ];

      return Promise.all(promises).then(([stopSequence, fullTrajectory]) => {
        const response = {
          fullTrajectory,
          stopSequence,
        };
        return response;
      });
    }

    /**
     * Get vehicle.
     * @param {function} filterFc A function use to filter results.
     * @return {Array<Object>} Array of vehicle.
     */
    getVehicle(filterFc: FilterFunction) {
      return (
        (this.trajectories &&
          // @ts-expect-error good type must be defined
          Object.values(this.trajectories).filter(filterFc)) ||
        []
      );
    }

    highlightVehicle(id: RealtimeTrainId) {
      if (this.hoverVehicleId !== id) {
        /** @private */
        this.hoverVehicleId = id;
        // @ts-expect-error good type must be defined
        this.renderTrajectories(true);
      }
    }

    /**
     * Callback on websocket's deleted_vehicles channel events.
     * It removes the trajectory from the list.
     *
     * @private
     * @override
     */
    onDeleteTrajectoryMessage(
      data: WebSocketAPIMessageEventData<RealtimeTrainId>,
    ) {
      if (!data.content) {
        return;
      }
      this.removeTrajectory(data.content);
    }

    onDocumentVisibilityChange() {
      if (document.hidden) {
        this.stop();

        // Since we don't receive deleted_vehicles event when docuement
        // is hidden. We have to clean all the trajectories for a fresh
        // start when the document is visible again.
        this.trajectories = {};
      } else {
        if (this.getVisible() === false) {
          return;
        }
        this.start();
      }
    }

    /**
     * Callback on websocket's trajectory channel events.
     * It adds a trajectory to the list.
     *
     * @private
     */
    onTrajectoryMessage(
      data: WebSocketAPIMessageEventData<RealtimeTrajectory>,
    ) {
      if (!data.content) {
        return;
      }
      const trajectory = data.content;

      const {
        geometry,
        properties: {
          raw_coordinates: rawCoordinates,
          time_since_update: timeSinceUpdate,
          train_id: id,
        },
      } = trajectory;

      // ignore old events [SBAHNM-97]
      // @ts-expect-error can be undefined
      if (timeSinceUpdate < 0) {
        return;
      }

      // console.time(`onTrajectoryMessage${data.content.properties.train_id}`);
      // @ts-expect-error    default value for extentand zoom are provided by subclasses
      if (this.purgeTrajectory(trajectory)) {
        return;
      }

      if (
        this.debug &&
        this.mode === RealtimeModes.TOPOGRAPHIC &&
        rawCoordinates
      ) {
        // @ts-expect-error
        trajectory.properties.olGeometry = this.format.readGeometry({
          coordinates: fromLonLat(
            rawCoordinates,
            this.map.getView().getProjection(),
          ),
          type: 'Point',
        });
      } else {
        // @ts-expect-error
        trajectory.properties.olGeometry = this.format.readGeometry(geometry);
      }

      // TODO Make sure the timeOffset is useful. May be we can remove it.
      // @ts-expect-error
      trajectory.properties.timeOffset = Date.now() - data.timestamp;
      this.addTrajectory(trajectory);
    }

    /**
     * On zoomend we adjust the time interval of the update of vehicles positions.
     *
     * @param evt Event that triggered the function.
     * @private
     */
    onZoomEnd() {
      this.startUpdateTime();
    }

    /**
     * Remove all trajectories that are in the past.
     */
    purgeOutOfDateTrajectories() {
      Object.entries(this.trajectories || {}).forEach(([key, trajectory]) => {
        const timeIntervals = trajectory?.properties?.time_intervals;
        if (this.time && timeIntervals?.length) {
          const lastTimeInterval = timeIntervals[timeIntervals.length - 1][0];
          if (lastTimeInterval < this.time.getTime()) {
            this.removeTrajectory(key);
          }
        }
      });
    }

    /**
     * Determine if the trajectory is useless and should be removed from the list or not.
     * By default, this function exclude vehicles:
     *  - that have their trajectory outside the current extent and
     *  - that aren't in the MOT list.
     *
     * @param {RealtimeTrajectory} trajectory
     * @param {Array<number>} extent
     * @param {number} zoom
     * @return {boolean} if the trajectory must be displayed or not.
     * @private
     */
    purgeTrajectory(
      trajectory: RealtimeTrajectory,
      extent: [number, number, number, number],
      zoom: number,
    ) {
      const { bounds, type } = trajectory.properties;

      if (
        (this.isUpdateBboxOnMoveEnd && !intersects(extent, bounds)) ||
        (this.mots && !this.mots.includes(type))
      ) {
        this.removeTrajectory(trajectory);
        return true;
      }
      return false;
    }

    removeTrajectory(trajectoryOrId: RealtimeTrainId | RealtimeTrajectory) {
      let id: string | undefined;
      if (typeof trajectoryOrId !== 'string') {
        id = trajectoryOrId?.properties?.train_id;
      } else {
        id = trajectoryOrId;
      }
      if (id !== undefined && this.trajectories) {
        delete this.trajectories[id];
      }
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
    renderTrajectories(
      viewState: undefined | ViewState,
      noInterpolate: boolean | undefined,
    ) {
      if (this.requestId) {
        cancelAnimationFrame(this.requestId);
        this.requestId = undefined;
      }

      if (!viewState) {
        return;
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
    renderTrajectoriesInternal(viewState: ViewState, noInterpolate = false) {
      if (!this.map || !this.trajectories) {
        return false;
      }
      const time = this.live ? Date.now() : this.time?.getTime();

      const trajectories = Object.values(this.trajectories);

      // console.time('sort');
      if (this.sort) {
        // @ts-expect-error type problem
        trajectories.sort(this.sort);
      }
      // console.timeEnd('sort');

      if (!this.canvas || !this.style) {
        return true;
      }

      // console.time('render');
      this.renderState = renderTrajectories(
        this.canvas,
        trajectories,
        this.style,
        {
          ...viewState,
          pixelRatio: this.pixelRatio || 1,
          time,
        },
        {
          filter: this.filter,
          hoverVehicleId: this.hoverVehicleId,
          noInterpolate:
            (viewState.zoom || 0) < this.minZoomInterpolation
              ? true
              : noInterpolate,
          selectedVehicleId: this.selectedVehicleId,
          ...this.styleOptions,
        },
      );

      // console.timeEnd('render');
      return true;
    }

    selectVehicle(id: RealtimeTrainId) {
      if (this.selectedVehicleId !== id) {
        /** @private */
        this.selectedVehicleId = id;
        // @ts-expect-error
        this.renderTrajectories(true);
      }
    }

    setBbox(extent: [number, number, number, number], zoom: number) {
      // Clean trajectories before sending the new bbox
      // Purge trajectories:
      // - which are outside the extent
      // - when it's bus and zoom level is too low for them
      if (this.trajectories && extent && zoom) {
        const keys = Object.keys(this.trajectories);
        for (let i = keys.length - 1; i >= 0; i -= 1) {
          this.purgeTrajectory(this.trajectories[keys[i]], extent, zoom);
        }
      }

      // The backend only supports non float value
      const zoomFloor = Math.floor(zoom);

      if (!extent || Number.isNaN(zoomFloor)) {
        return;
      }

      // The extent does not need to be precise under meter, so we round floor/ceil the values.
      const [minX, minY, maxX, maxY] = extent;

      const bbox: RealtimeBbox = [
        Math.floor(minX),
        Math.floor(minY),
        Math.ceil(maxX),
        Math.ceil(maxY),
        zoomFloor,
      ];

      /* @private */
      this.generalizationLevel = this.getGeneralizationLevelByZoom(zoomFloor);
      if (this.generalizationLevel) {
        bbox.push(`gen=${this.generalizationLevel}`);
      }

      /* @private */
      this.mots = this.getMotsByZoom(zoomFloor);
      if (this.mots) {
        bbox.push(`mots=${this.mots}`);
      }

      if (this.tenant) {
        bbox.push(`tenant=${this.tenant}`);
      }

      if (this.mode !== 'topographic') {
        bbox.push(`channel_prefix=${this.mode}`);
      }

      if (this.bboxParameters) {
        Object.entries(this.bboxParameters).forEach(([key, value]) => {
          bbox.push(`${key}=${value}`);
        });
      }

      // Extent and zoom level are mandatory.
      this.api.bbox = bbox;
    }

    start() {
      this.stop();

      // Before starting to update trajectories, we remove trajectories that have
      // a time_intervals in the past, it will
      // avoid phantom train that are at the end of their route because we never
      // received the deleted_vehicle event because we have changed the browser tab.
      this.purgeOutOfDateTrajectories();

      // @ts-expect-error  function without parameters must be define  in subclasses
      this.renderTrajectories();
      this.startUpdateTime();

      this.api.open();
      this.api.subscribeTrajectory(
        this.mode,
        this.onTrajectoryMessage,
        undefined,
        this.isUpdateBboxOnMoveEnd,
      );
      this.api.subscribeDeletedVehicles(
        this.mode,
        this.onDeleteTrajectoryMessage,
        undefined,
        this.isUpdateBboxOnMoveEnd,
      );

      if (this.isUpdateBboxOnMoveEnd) {
        // Update the bbox on each move end
        // @ts-expect-error  function without parameters defined by subclasses
        this.setBbox();
      }

      if (this.onStart) {
        this.onStart(this);
      }
    }

    /**
     * Start the clock.
     * @private
     */
    startUpdateTime() {
      this.stopUpdateTime();
      this.updateTimeDelay = this.getRefreshTimeInMs() || 0;
      this.updateTimeInterval = window.setInterval(() => {
        // When live=true, we update the time with new Date();
        if (this.live) {
          this.time = new Date();
        } else if (this.time && this.updateTimeDelay && this.speed) {
          this.time = new Date(
            this.time.getTime() + this.updateTimeDelay * this.speed,
          );
        }
      }, this.updateTimeDelay);
    }

    stop() {
      this.api.unsubscribeTrajectory(this.onTrajectoryMessage);
      this.api.unsubscribeDeletedVehicles(this.onDeleteTrajectoryMessage);
      this.api.close();
      if (this.onStop) {
        this.onStop(this);
      }
    }

    /**
     * Stop the clock.
     * @private
     */
    stopUpdateTime() {
      if (this.updateTimeInterval) {
        clearInterval(this.updateTimeInterval);
        this.updateTimeInterval = undefined;
      }
    }

    // /**
    //  * Callback when user moves the mouse/pointer over the map.
    //  * It sets the layer's hoverVehicleId property with the current hovered vehicle's id.
    //  *
    //  * @private
    //  * @override
    //  */
    // onFeatureHover(
    //   features: (Feature | GeoJSONFeature)[],
    //   layer: AnyRealtimeLayer,
    //   coordinate: Coordinate,
    // ) {
    //   const [feature] = features;
    //   let id = null;
    //   if (feature) {
    //     id = (feature as Feature).get
    //       ? (feature as Feature).get('train_id')
    //       : (feature as GeoJSONFeature).properties.train_id;
    //   }
    //   if (this.hoverVehicleId !== id) {
    //     /** @private */
    //     this.hoverVehicleId = id;
    //     // @ts-expect-error
    //     this.renderTrajectories(true);
    //   }
    // }

    // /**
    //  * Callback when user clicks on the map.
    //  * It sets the layer's selectedVehicleId property with the current selected vehicle's id.
    //  *
    //  * @private
    //  * @override
    //  */
    // onFeatureClick(features: (Feature | GeoJSONFeature)[]) {
    //   const [feature] = features;
    //   let id = null;
    //   if (feature) {
    //     id = (feature as Feature).get
    //       ? (feature as Feature).get('train_id')
    //       : (feature as GeoJSONFeature).properties.train_id;
    //   }
    //   if (this.selectedVehicleId !== id) {
    //     /** @private */
    //     this.selectedVehicleId = id;
    //     this.selectedVehicle = feature;

    //     // @ts-expect-error  parameters are provided by subclasses
    //     this.renderTrajectories(true);
    //   }
    // }
  };
}

export default RealtimeLayerMixin;
