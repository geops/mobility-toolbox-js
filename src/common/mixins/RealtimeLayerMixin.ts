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
import { EventsKey } from 'ol/events';
import { ObjectEvent } from 'ol/Object';
import { Coordinate } from 'ol/coordinate';
import { Feature } from 'ol';
import { GeoJSONFeature } from 'maplibre-gl';
import realtimeDefaultStyle from '../styles/realtimeDefaultStyle';
import { RealtimeAPI, RealtimeModes } from '../../api';
import renderTrajectories from '../utils/renderTrajectories';
import * as realtimeConfig from '../utils/realtimeConfig';
import {
  AnyCanvas,
  AnyLayerClass,
  AnyMap,
  AnyRealtimeLayer,
  LayerGetFeatureInfoOptions,
  RealtimeGeneralizationLevel,
  RealtimeMode,
  RealtimeMot,
  RealtimeRenderState,
  RealtimeStyleFunction,
  RealtimeStyleOptions,
  RealtimeTenant,
  RealtimeTrainId,
  ViewState,
  AnyLayer,
} from '../../types';
import { RealtimeTrajectory } from '../../api/typedefs';
import { WebSocketAPIMessageEventData } from '../api/WebSocketAPI';
import LayerCommon from './PropertiesLayerMixin';
import type { OlLayerOptions } from '../../ol/layers/Layer';
import { FilterFunction, SortFunction } from '../typedefs';

export type RealtimeLayerMixinOptions = OlLayerOptions & {
  debug?: boolean;
  mode?: RealtimeMode;
  api?: RealtimeAPI;
  tenant?: RealtimeTenant;
  minZoomInterpolation?: number;
  isUpdateBboxOnMoveEnd?: boolean;
  motsByZoom?: RealtimeMot[][];
  generalizationLevelByZoom?: RealtimeGeneralizationLevel[];
  renderTimeIntervalByZoom?: number[];
  style?: RealtimeStyleFunction;
  speed?: number;
  pixelRatio?: number;
  hoverVehicleId?: RealtimeTrainId;
  selectedVehicleId?: RealtimeTrainId;
  filter?: FilterFunction;
  sort?: SortFunction;
  time?: number;
  live?: boolean;
  canvas?: HTMLCanvasElement;
  styleOptions?: RealtimeStyleOptions;
  useRequestAnimationFrame?: boolean;
  useDebounce?: boolean;
  useThrottle?: boolean;
  getMotsByZoom: (zoom: number, motsByZoom: RealtimeMot[][]) => RealtimeMot[];
  getGeneralizationLevelByZoom?: (
    zoom: number,
    generalizationLevelByZoom: RealtimeGeneralizationLevel[],
  ) => RealtimeGeneralizationLevel;
  getRenderTimeIntervalByZoom?: (
    zoom: number,
    renderTimeIntervalByZoom: number[],
  ) => number;
  onStart?: (realtimeLayer: AnyRealtimeLayer) => void;
  onStop?: (realtimeLayer: AnyRealtimeLayer) => void;

  // From RealtimeAPIOptions
  url?: string;
  apiKey?: string;
  prefix?: string;
  projection?: string;
  bbox?: (number | string)[];
  buffer?: number[];
  pingIntervalMs?: number;
  bboxParameters?: {
    [index: string]:
      | string
      | number
      | boolean
      | string[]
      | boolean[]
      | number[];
  };
};

/**
 * RealtimeLayerInterface.
 */
export class RealtimeLayerInterface {
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
  setBbox(extent: [number, number, number, number], zoom: number) {}

  /**
   * Render the trajectories
   */
  renderTrajectories() {}

  /**
   * Request the stopSequence and the fullTrajectory informations for a vehicle.
   *
   * @param {string} id The vehicle identifier (the  train_id property).
   * @param {RealtimeMode} mode The mode to request. If not defined, the layer´s mode propetrty will be used.
   * @return {Promise<{stopSequence: StopSequence, fullTrajectory: FullTrajectory>} A promise that will be resolved with the trajectory informations.
   */
  getTrajectoryInfos(id: string, mode: RealtimeMode) {}
}

/**
 * Mixin for RealtimeLayerInterface.
 *
 * @param {Class} Base A class to extend with {RealtimeLayerInterface} functionnalities.
 * @return {Class}  A class that implements {RealtimeLayerInterface} class and extends Base;
 * @private
 */
function RealtimeLayerMixin<T extends AnyLayerClass>(Base: T) {
  // @ts-ignore
  return class Mixin extends Base {
    debug: boolean;

    trajectories?: { [key: RealtimeTrainId]: RealtimeTrajectory };

    canvas?: AnyCanvas;

    mode: RealtimeMode;

    api: RealtimeAPI;

    tenant: RealtimeTenant;

    bboxParameters?: {
      [index: string]:
        | string
        | number
        | boolean
        | string[]
        | boolean[]
        | number[];
    };

    time?: Date;

    live?: boolean;

    speed?: number;

    filter?: FilterFunction;

    sort?: SortFunction;

    style?: RealtimeStyleFunction;

    styleOptions?: RealtimeStyleOptions;

    pixelRatio?: number;

    minZoomInterpolation: number;

    isUpdateBboxOnMoveEnd: boolean;

    hoverVehicleId?: RealtimeTrainId;

    selectedVehicleId?: RealtimeTrainId;

    renderState?: RealtimeRenderState;

    useRequestAnimationFrame?: boolean;

    useDebounce?: boolean;

    useThrottle?: boolean;

    mots?: RealtimeMot[];

    motsByZoom: RealtimeMot[][];

    generalizationLevel?: RealtimeGeneralizationLevel;

    generalizationLevelByZoom: RealtimeGeneralizationLevel[];

    renderTimeIntervalByZoom: number[];

    format: GeoJSON;

    requestId?: number;

    updateTimeInterval?: number;

    updateTimeDelay?: number;

    visibilityRef!: EventsKey;

    selectedVehicle: RealtimeTrajectory;

    getMotsByZoom: (zoom: number) => RealtimeMot[];

    getGeneralizationLevelByZoom: (zoom: number) => RealtimeGeneralizationLevel;

    getRenderTimeIntervalByZoom: (zoom: number) => number;

    throttleRenderTrajectories: (
      viewState: ViewState,
      noInterpolate?: boolean,
    ) => void;

    debounceRenderTrajectories: (
      viewState: ViewState,
      noInterpolate?: boolean,
    ) => void;

    onStart?: (realtimeLayer: AnyLayer) => void;

    onStop?: (realtimeLayer: AnyLayer) => void;

    constructor(options: RealtimeLayerMixinOptions) {
      super({
        hitTolerance: 10,
        ...options,
      });
      this.defineProperties(options);

      this.debug = options.debug || false;
      this.mode = options.mode || (RealtimeModes.TOPOGRAPHIC as RealtimeMode);
      this.api = options.api || new RealtimeAPI(options);
      this.tenant = options.tenant || ''; // sbb,sbh or sbm
      this.minZoomInterpolation = options.minZoomInterpolation || 8; // Min zoom level from which trains positions are not interpolated.
      this.format = new GeoJSON();
      this.onStart = options.onStart;
      this.onStop = options.onStop;

      // MOTs by zoom
      const allMots: RealtimeMot[] = [
        'tram',
        'subway',
        'rail',
        'bus',
        'ferry',
        'cablecar',
        'gondola',
        'funicular',
        'coach',
      ];

      const onlyRail: RealtimeMot[] = ['rail'];
      const withoutCable: RealtimeMot[] = ['tram', 'subway', 'rail', 'bus'];

      // Server will block non train before zoom 9
      this.motsByZoom = options.motsByZoom || [
        onlyRail,
        onlyRail,
        onlyRail,
        onlyRail,
        onlyRail,
        onlyRail,
        onlyRail,
        onlyRail,
        onlyRail,
        withoutCable,
        withoutCable,
        allMots,
        allMots,
        allMots,
        allMots,
      ];
      this.getMotsByZoom = (zoom) => {
        return (
          (options.getMotsByZoom &&
            options.getMotsByZoom(zoom, this.motsByZoom)) ||
          this.motsByZoom[zoom] ||
          this.motsByZoom[this.motsByZoom.length - 1]
        );
      };

      // Generalization levels by zoom
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

      // Render time interval by zoom
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
     * @private
     */
    defineProperties(options: RealtimeLayerMixinOptions) {
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
        mode,
        bboxParameters,
      } = options;
      console.log('lalala', canvas);
      let currCanvas = canvas;
      let currSpeed = speed || 1;
      let currTime = time || new Date();
      let currMode = mode || (RealtimeModes.TOPOGRAPHIC as RealtimeMode);
      let currStyle = style || realtimeDefaultStyle;

      super.defineProperties(options);

      Object.defineProperties(this, {
        isTrackerLayer: { value: true },

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
         * Style function used to render a vehicle.
         */
        style: {
          get: () => currStyle,
          set: (newStyle: RealtimeStyleFunction) => {
            currStyle = newStyle;
            // @ts-ignore  function without parameters is defined in subclasses
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
         * Custom parameters to send on each BBOX request.
         */
        bboxParameters: {
          value: bboxParameters,
          writable: true,
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
            // @ts-ignore  function without parameters is defined in subclasses
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
          value: options.useThrottle !== false,
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

    attachToMap(map: AnyMap) {
      super.attachToMap(map);

      // If the layer is visible we start  the rendering clock
      // if (this.visible) {
      this.start();
      // }

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
      if (this.canvas) {
        const context = this.canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        super.detachFromMap();
      }
    }

    start() {
      this.stop();

      // Before starting to update trajectories, we remove trajectories that have
      // a time_intervals in the past, it will
      // avoid phantom train that are at the end of their route because we never
      // received the deleted_vehicle event because we have changed the browser tab.
      this.purgeOutOfDateTrajectories();

      // @ts-ignore function without parameters must be define  in subclasses
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
        // @ts-ignore function without parameters defined by subclasses
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
    renderTrajectoriesInternal(
      viewState: ViewState,
      noInterpolate: boolean = false,
    ) {
      if (!this.map || !this.trajectories) {
        return false;
      }
      const time = this.live ? Date.now() : this.time?.getTime();

      const trajectories = Object.values(this.trajectories);

      // console.time('sort');
      if (this.sort) {
        // @ts-ignore
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
          noInterpolate:
            (viewState.zoom || 0) < this.minZoomInterpolation
              ? true
              : noInterpolate,
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
    renderTrajectories(
      viewState: ViewState | undefined,
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

    setBbox(extent?: [number, number, number, number], zoom?: number) {
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

      if (!extent) {
        return;
      }

      const bbox: (number | string)[] = [...extent];

      if (this.isUpdateBboxOnMoveEnd && zoom) {
        bbox.push(zoom);

        /* @private */
        this.generalizationLevel = this.getGeneralizationLevelByZoom(zoom);
        if (this.generalizationLevel) {
          bbox.push(`gen=${this.generalizationLevel}`);
        }

        /* @private */
        this.mots = this.getMotsByZoom(zoom);
        if (this.mots) {
          bbox.push(`mots=${this.mots}`);
        }
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

      this.api.bbox = bbox;
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
    getVehicle(filterFc: FilterFunction) {
      return (
        (this.trajectories &&
          // @ts-ignore
          Object.values(this.trajectories).filter(filterFc)) ||
        []
      );
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
      const { resolution, nb } = options;
      const ext = buffer(
        [...coordinate, ...coordinate],
        this.hitTolerance * resolution,
      );
      let trajectories = Object.values(this.trajectories || {});

      if (this.sort) {
        // @ts-ignore
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
        features: vehicles,
        coordinate,
      });
    }

    /**
     * Request the stopSequence and the fullTrajectory informations for a vehicle.
     *
     * @param {string} id The vehicle identifier (the  train_id property).
     * @return {Promise<{stopSequence: StopSequence, fullTrajectory: FullTrajectory>} A promise that will be resolved with the trajectory informations.
     */
    getTrajectoryInfos(id: RealtimeTrainId) {
      // When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
      // Then we combine them in one response and send them to inherited layers.
      const promises = [
        this.api.getStopSequence(id),
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
     * Remove all trajectories that are in the past.
     */
    purgeOutOfDateTrajectories() {
      Object.entries(this.trajectories || {}).forEach(([key, trajectory]) => {
        const timeIntervals = trajectory?.properties?.time_intervals;
        if (this.time && timeIntervals.length) {
          const lastTimeInterval = timeIntervals[timeIntervals.length - 1][0];
          if (lastTimeInterval < this.time) {
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
      const { type, bounds } = trajectory.properties;

      if (
        (this.isUpdateBboxOnMoveEnd && !intersects(extent, bounds)) ||
        (this.mots && !this.mots.includes(type))
      ) {
        this.removeTrajectory(trajectory);
        return true;
      }
      return false;
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
      this.trajectories[trajectory.properties.train_id] = trajectory;
      // @ts-ignore the parameter are set by subclasses
      this.renderTrajectories();
    }

    removeTrajectory(trajectoryOrId: RealtimeTrajectory | RealtimeTrainId) {
      let id: string;
      if (typeof trajectoryOrId !== 'string') {
        id = trajectoryOrId?.properties?.train_id;
      } else {
        id = trajectoryOrId;
      }
      if (this.trajectories) {
        delete this.trajectories[id];
      }
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

    onDocumentVisibilityChange() {
      if (!this.visible) {
        return;
      }
      if (document.hidden) {
        this.stop();

        // Since we don't receive deleted_vehicles event when docuement
        // is hidden. We have to clean all the trajectories for a fresh
        // start when the document is visible again.
        this.trajectories = {};
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
      // @ts-ignore   default value for extentand zoom are provided by subclasses
      if (this.purgeTrajectory(trajectory)) {
        return;
      }

      if (
        this.debug &&
        this.mode === RealtimeModes.TOPOGRAPHIC &&
        rawCoordinates
      ) {
        trajectory.properties.olGeometry = this.format.readGeometry({
          type: 'Point',
          coordinates: fromLonLat(
            rawCoordinates,
            this.map.getView().getProjection(),
          ),
        });
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
    onDeleteTrajectoryMessage(
      data: WebSocketAPIMessageEventData<RealtimeTrainId>,
    ) {
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
    onFeatureHover(
      features: (Feature | GeoJSONFeature)[],
      layer: AnyRealtimeLayer,
      coordinate: Coordinate,
    ) {
      const [feature] = features;
      let id = null;
      if (feature) {
        id = (feature as Feature).get
          ? (feature as Feature).get('train_id')
          : (feature as GeoJSONFeature).properties.train_id;
      }
      if (this.hoverVehicleId !== id) {
        /** @private */
        this.hoverVehicleId = id;
        // @ts-ignore
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
    onFeatureClick(features: (Feature | GeoJSONFeature)[]) {
      const [feature] = features;
      let id = null;
      if (feature) {
        id = (feature as Feature).get
          ? (feature as Feature).get('train_id')
          : (feature as GeoJSONFeature).properties.train_id;
      }
      if (this.selectedVehicleId !== id) {
        /** @private */
        this.selectedVehicleId = id;
        this.selectedVehicle = feature;

        // @ts-ignore parameters are provided by subclasses
        this.renderTrajectories(true);
      }
    }
  };
}

export default RealtimeLayerMixin;
