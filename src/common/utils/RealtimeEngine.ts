import { FeatureCollection } from 'geojson';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { buffer, containsCoordinate, intersects } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';

import { RealtimeAPI, RealtimeModes } from '../../api';
import { WebSocketAPIMessageEventData } from '../../api/WebSocketAPI';
import {
  AnyCanvas,
  LayerGetFeatureInfoOptions,
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

import * as realtimeConfig from './realtimeConfig';
import renderTrajectories from './renderTrajectories';

import type { Coordinate } from 'ol/coordinate';

export interface RealtimeEngineOptions {
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
  getViewState?: () => ViewState;
  hoverVehicleId?: RealtimeTrainId;
  isUpdateBboxOnMoveEnd?: boolean;
  live?: boolean;
  minZoomInterpolation?: number;
  mode?: RealtimeMode;
  motsByZoom?: RealtimeMot[][];
  onRender?: (renderState: RealtimeRenderState, viewState: ViewState) => void;
  onStart?: (realtimeEngine: RealtimeEngine) => void;
  onStop?: (realtimeEngine: RealtimeEngine) => void;
  pingIntervalMs?: number;
  pixelRatio?: number;
  prefix?: string;
  renderTimeIntervalByZoom?: number[];
  selectedVehicleId?: RealtimeTrainId;
  shouldRender?: () => boolean;
  sort?: SortFunction;
  speed?: number;
  style?: RealtimeStyleFunction;
  styleOptions?: RealtimeStyleOptions;
  tenant?: RealtimeTenant;
  time?: Date;
  url?: string;
  useDebounce?: boolean;
  useRequestAnimationFrame?: boolean;
  useThrottle?: boolean;
}

/**
 * This class is responsible for drawing trajectories from a realtime API in a canvas,
 * depending on the map's view state and at a specific time.
 *
 * This class is totally agnostic from Maplibre or OpenLayers and must stay taht way.
 */
class RealtimeEngine {
  _mode: RealtimeMode;
  _speed: number;
  _style: RealtimeStyleFunction;
  _time: Date;
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
  mots?: RealtimeMot[];
  motsByZoom: RealtimeMot[][];
  onRender?: (renderState: RealtimeRenderState, viewState: ViewState) => void;
  onStart?: (realtimeLayer: RealtimeEngine) => void;
  onStop?: (realtimeLayer: RealtimeEngine) => void;
  pixelRatio?: number;
  renderState?: RealtimeRenderState;
  renderTimeIntervalByZoom: number[];
  requestId?: number;
  selectedVehicle!: RealtimeTrajectory;
  selectedVehicleId?: RealtimeTrainId;
  sort?: SortFunction;
  styleOptions?: RealtimeStyleOptions;
  tenant: RealtimeTenant;
  throttleRenderTrajectories: (
    viewState: ViewState,
    noInterpolate?: boolean,
  ) => void;
  trajectories?: Record<RealtimeTrainId, RealtimeTrajectory>;
  updateTimeDelay?: number;
  updateTimeInterval?: number;
  useDebounce?: boolean;
  useRequestAnimationFrame?: boolean;
  useThrottle?: boolean;
  get mode() {
    return this._mode;
  }
  set mode(newMode: RealtimeMode) {
    if (newMode === this._mode) {
      return;
    }
    this._mode = newMode;
    if (this.api?.wsApi?.open) {
      this.stop();
      this.start();
    }
  }

  get speed() {
    return this._speed;
  }

  set speed(newSpeed: number) {
    this._speed = newSpeed;
    this.start();
  }

  get style() {
    return this._style;
  }

  set style(newStyle: RealtimeStyleFunction) {
    this._style = newStyle;
    this.renderTrajectories();
  }

  get time(): Date {
    return this._time;
  }

  set time(newTime: Date | number) {
    this._time = (newTime as Date)?.getTime
      ? (newTime as Date)
      : new Date(newTime);
    this.renderTrajectories();
  }

  constructor(options: RealtimeEngineOptions) {
    this._mode = options.mode || RealtimeModes.TOPOGRAPHIC;
    this._speed = options.speed || 1; // If live property is true. The speed is ignored.
    this._style = options.style || realtimeDefaultStyle;
    this._time = options.time || new Date();

    this.api = options.api || new RealtimeAPI(options);
    this.bboxParameters = options.bboxParameters;
    this.canvas = options.canvas || document.createElement('canvas');
    this.debug = options.debug || false;
    this.filter = options.filter;
    this.hoverVehicleId = options.hoverVehicleId;

    /**
     * If true. The layer will always use Date.now() on the next tick to render the trajectories.
     * When true, setting the time property has no effect.
     */
    this.live = options.live !== false;

    this.minZoomInterpolation = options.minZoomInterpolation || 8; // Min zoom level from which trains positions are not interpolated.
    this.pixelRatio =
      options.pixelRatio ||
      (typeof window !== 'undefined' ? window.devicePixelRatio : 1);
    this.selectedVehicleId = options.selectedVehicleId;
    this.sort = options.sort;

    /**
     * Custom options to pass as last parameter of the style function.
     */
    // @ts-expect-error good type must be defined
    this.styleOptions = { ...realtimeConfig, ...(options.styleOptions || {}) };
    this.tenant = options.tenant || ''; // sbb,sbh or sbm
    this.trajectories = {};
    this.useDebounce = options.useDebounce || false;
    this.useRequestAnimationFrame = options.useRequestAnimationFrame || false;
    this.useThrottle = options.useThrottle !== false; // the default behavior

    this.getViewState = options.getViewState || (() => ({}));
    this.shouldRender = options.shouldRender || (() => true);
    this.onRender = options.onRender;
    this.onStart = options.onStart;
    this.onStop = options.onStop;

    this.format = new GeoJSON();

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

    // Mots by zoom
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

    this.renderState = {
      center: [0, 0],
      rotation: 0,
      zoom: undefined,
    };

    this.onTrajectoryMessage = this.onTrajectoryMessage.bind(this);
    this.onDeleteTrajectoryMessage = this.onDeleteTrajectoryMessage.bind(this);
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
    this.renderTrajectories();
  }

  attachToMap() {
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
    }
  }

  /**
   * Get the duration before the next update depending on zoom level.
   *
   * @private
   */
  getRefreshTimeInMs(): number {
    const viewState = this.getViewState();
    const zoom = viewState.zoom || 0;
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
   * Get vehicle.
   * @param {function} filterFc A function use to filter results.
   * @return {Array<Object>} Array of vehicle.
   */
  getVehicles(filterFc: FilterFunction) {
    return (
      (this.trajectories &&
        // @ts-expect-error good type must be defined
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
  getVehiclesAtCoordinate(
    coordinate: Coordinate,
    options?: LayerGetFeatureInfoOptions,
  ): FeatureCollection {
    const { resolution } = this.getViewState();
    const { hitTolerance, nb } = options || {};
    const ext = buffer(
      [...coordinate, ...coordinate],
      (hitTolerance || 5) * (resolution || 1),
    );
    let trajectories = Object.values(this.trajectories || {});

    if (this.sort) {
      // @ts-expect-error good type must be defined
      trajectories = trajectories.sort(this.sort);
    }

    const vehicles = [];
    for (let i = 0; i < trajectories.length; i += 1) {
      const { coordinate: trajcoord } = trajectories[i].properties;
      if (trajcoord && containsCoordinate(ext, trajcoord)) {
        vehicles.push(trajectories[i]);
      }
      if (vehicles.length === nb) {
        break;
      }
    }
    return { features: vehicles, type: 'FeatureCollection' };
  }

  getViewState: () => ViewState = () => ({});

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
      const viewState = this.getViewState();
      if (!viewState.visible) {
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
  onTrajectoryMessage(data: WebSocketAPIMessageEventData<RealtimeTrajectory>) {
    if (!data.content) {
      return;
    }
    const trajectory = data.content;

    const {
      geometry,
      properties: {
        raw_coordinates: rawCoordinates,
        time_since_update: timeSinceUpdate,
      },
    } = trajectory;

    // ignore old events [SBAHNM-97]
    // @ts-expect-error can be undefined
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
      // @ts-expect-error missing type definition
      trajectory.properties.olGeometry = this.format.readGeometry({
        coordinates: fromLonLat(rawCoordinates),
        type: 'Point',
      });
    } else {
      // @ts-expect-error missing type definition
      trajectory.properties.olGeometry = this.format.readGeometry(geometry);
    }

    // TODO Make sure the timeOffset is useful. May be we can remove it.
    // @ts-expect-error missing type definition
    trajectory.properties.timeOffset = Date.now() - data.timestamp;
    this.addTrajectory(trajectory);
  }

  /**
   * On zoomend we adjust the time interval of the update of vehicles positions.
   *
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
   * @return {boolean} if the trajectory must be displayed or not.
   * @private
   */
  purgeTrajectory(trajectory: RealtimeTrajectory) {
    const viewState = this.getViewState();
    const extent = viewState.extent;
    const { bounds, type } = trajectory.properties;

    if (
      (this.isUpdateBboxOnMoveEnd && extent && !intersects(extent, bounds)) ||
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
   * @param {boolean} noInterpolate If true trajectories are not interpolated but
   *   drawn at the last known coordinate. Use this for performance optimization
   *   during map navigation.
   * @private
   */
  renderTrajectories(noInterpolate?: boolean) {
    const viewState = this.getViewState();

    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }

    if (!viewState?.center || !viewState?.extent || !viewState?.size) {
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
    if (!this.trajectories || !this.shouldRender()) {
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

    this.onRender?.(this.renderState, viewState);

    // console.timeEnd('render');
    return true;
  }

  setBbox() {
    const viewState = this.getViewState();
    const extent = viewState.extent;
    const zoom = viewState.zoom || 0;

    if (!extent || Number.isNaN(zoom)) {
      return;
    }
    // Clean trajectories before sending the new bbox
    // Purge trajectories:
    // - which are outside the extent
    // - when it's bus and zoom level is too low for them
    if (this.trajectories && extent && zoom) {
      const keys = Object.keys(this.trajectories);
      for (let i = keys.length - 1; i >= 0; i -= 1) {
        this.purgeTrajectory(this.trajectories[keys[i]]);
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        bbox.push(`${key}=${value}`);
      });
    }

    // Extent and zoom level are mandatory.
    this.api.bbox = bbox;
  }

  shouldRender: () => boolean = () => true;

  start() {
    this.stop();

    // Before starting to update trajectories, we remove trajectories that have
    // a time_intervals in the past, it will
    // avoid phantom train that are at the end of their route because we never
    // received the deleted_vehicle event because we have changed the browser tab.
    this.purgeOutOfDateTrajectories();

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

    // Update the bbox on each move end
    if (this.isUpdateBboxOnMoveEnd) {
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
}

export default RealtimeEngine;
