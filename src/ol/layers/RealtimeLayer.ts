import debounce from 'lodash.debounce';
import { getIntersection, isEmpty } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import Layer from 'ol/layer/Layer';
import VectorLayer from 'ol/layer/Vector';
import { unByKey } from 'ol/Observable';
import { Vector as VectorSource } from 'ol/source';
import Source from 'ol/source/Source';

import { realtimeDefaultStyle } from '../../common/styles';
import RealtimeEngine from '../../common/utils/RealtimeEngine';
import {
  type RealtimeMode,
  type RealtimeRenderState,
  type RealtimeStopSequence,
  type RealtimeStyleFunction,
  type RealtimeTrainId,
  type RealtimeTrajectory,
  type ViewState,
} from '../../types';
import RealtimeLayerRenderer from '../renderers/RealtimeLayerRenderer';
import { fullTrajectoryStyle } from '../styles';
import defineDeprecatedProperties from '../utils/defineDeprecatedProperties';

import { deprecated } from './MaplibreLayer';

import type { DebouncedFunc } from 'lodash';
import type { Map, MapEvent } from 'ol';
import type { EventsKey } from 'ol/events';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type { ObjectEvent } from 'ol/Object';
import type LayerRenderer from 'ol/renderer/Layer';
import type { State } from 'ol/View';

import type { FilterFunction, SortFunction } from '../../common/typedefs';
import type { RealtimeEngineOptions } from '../../common/utils/RealtimeEngine';
import type { RealtimeAPI } from '../../maplibre';
import type { RealtimeStyleOptions } from '../../types';

import type { MobilityLayerOptions } from './Layer';

const format = new GeoJSON();

export type RealtimeLayerOptions = {
  allowRenderWhenAnimating?: boolean;
  fullTrajectoryStyle?: (
    feature: FeatureLike,
    resolution: number,
    layer: RealtimeLayer,
  ) => void;
  maxNbFeaturesRequested?: number;
  styleOptions?: Partial<RealtimeStyleOptions>;
} & MobilityLayerOptions &
  Omit<RealtimeEngineOptions, 'styleOptions'>;

/**
 * An OpenLayers layer able to display data from the [geOps Realtime API](https://developer.geops.io/apis/realtime/).
 *
 * @example
 * import { RealtimeLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new RealtimeLayer({
 *   apiKey: "yourApiKey"
 *   // allowRenderWhenAnimating: false,
 *   // url: "wss://api.geops.io/tracker-ws/v1/",
 * });
 *
 *
 * @see <a href="/doc/class/build/api/RealtimeAPI%20js~RealtimeAPI%20html-offset-anchor">RealtimeAPI</a>
 * @see <a href="/example/ol-realtime">OpenLayers Realtime layer example</a>
 *
 *
 * @extends {ol/layer/Layer~Layer}
 *
 *
 * @classproperty {boolean} allowRenderWhenAnimating - Allow rendering of the layer when the map is animating.
 * @public
 */
class RealtimeLayer extends Layer<Source> {
  allowRenderWhenAnimating?: boolean = false;
  currentZoom?: number;
  engine: RealtimeEngine;
  maxNbFeaturesRequested = 100;
  public olEventsKeys: EventsKey[] = [];
  onMoveEndDebounced: DebouncedFunc<(evt: MapEvent | ObjectEvent) => void>;
  onZoomEndDebounced: DebouncedFunc<(evt: MapEvent | ObjectEvent) => void>;
  renderedViewState: State | undefined;
  vectorLayer: VectorLayer<VectorSource>;

  get api() {
    return this.engine.api;
  }

  set api(api: RealtimeAPI) {
    this.engine.api = api;
  }
  get canvas() {
    return this.engine.canvas;
  }

  get filter(): FilterFunction | undefined {
    return this.engine.filter;
  }

  set filter(filter: FilterFunction) {
    this.engine.filter = filter;
  }

  get hoverVehicleId(): RealtimeTrainId | undefined {
    return this.engine.hoverVehicleId;
  }

  set hoverVehicleId(id: RealtimeTrainId) {
    this.engine.hoverVehicleId = id;
  }

  get mode() {
    return this.engine.mode;
  }

  set mode(mode: RealtimeMode) {
    this.engine.mode = mode;
  }

  get pixelRatio() {
    return this.engine.pixelRatio;
  }

  get selectedVehicleId(): RealtimeTrainId | undefined {
    return this.engine.selectedVehicleId;
  }

  set selectedVehicleId(id: RealtimeTrainId) {
    this.engine.selectedVehicleId = id;
  }

  get sort(): SortFunction | undefined {
    return this.engine.sort;
  }

  set sort(sort: SortFunction) {
    this.engine.sort = sort;
  }

  get style() {
    return this.engine?.style;
  }

  set style(style: RealtimeStyleFunction) {
    if (this.engine) {
      this.engine.style = style;
    }
  }

  get styleOptions() {
    return this.engine.styleOptions;
  }

  set styleOptions(options) {
    this.engine.styleOptions = options;
  }

  get time() {
    return this.engine.time || new Date();
  }

  set time(time: Date) {
    this.engine.time = time;
  }

  get trajectories() {
    return this.engine.trajectories;
  }

  /**
   * Constructor.
   *
   * @param {RealtimeLayerOptions} options
   * @param {boolean} [options.allowRenderWhenAnimating=false] Allow rendering of the layer when the map is animating.
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string} [options.url="wss://api.geops.io/tracker-ws/v1/"] The [geOps Realtime API](https://developer.geops.io/apis/realtime/) url.
   * @public
   */
  constructor(options: RealtimeLayerOptions) {
    // We use a group to be able to add custom vector layer in extended class.
    // For example TrajservLayer use a vectorLayer to display the complete trajectory.
    super({
      minZoom: 4, // The websocket returns nothing before zoom level 4
      source: new Source({}), // TODO set some attributions
      ...options,
    });

    // For backward compatibility with v2
    defineDeprecatedProperties(this, options);

    this.engine = new RealtimeEngine({
      getViewState: this.getViewState.bind(this),
      onIdle: this.onRealtimeEngineIdle.bind(this),
      onRender: this.onRealtimeEngineRender.bind(this),
      style: realtimeDefaultStyle,
      ...options,
    });

    this.allowRenderWhenAnimating = !!options.allowRenderWhenAnimating;

    // We store the layer used to highlight the full Trajectory

    this.vectorLayer = new VectorLayer<VectorSource>({
      minZoom: this.getMinZoom(),
      source: new VectorSource<Feature>({ features: [] }),
      style: (feature, resolution) => {
        return (options.fullTrajectoryStyle || fullTrajectoryStyle)(
          feature as Feature,
          resolution,
          this,
        );
      },
      updateWhileAnimating: this.allowRenderWhenAnimating,
      updateWhileInteracting: true,
    });

    this.onZoomEndDebounced = debounce(this.onZoomEnd, 100);

    this.onMoveEndDebounced = debounce(this.onMoveEnd, 100);
  }

  /**
   * Add a trajectory.
   * @param trajectory
   */
  addTrajectory(trajectory: RealtimeTrajectory) {
    this.engine?.addTrajectory(trajectory);
  }

  attachToMap() {
    this.engine.attachToMap();
    const mapInternal = this.getMapInternal();
    if (mapInternal) {
      // If the layer is visible we start  the rendering clock
      if (this.getVisible()) {
        this.engine.start();
      }
      this.olEventsKeys.push(
        mapInternal.on('movestart', () => {
          if (this.engine.isUpdateBboxOnMoveEnd) {
            this.engine.updateIdleState();
          }
        }),
        ...mapInternal.on(
          ['moveend', 'change:target'],
          // @ts-expect-error  - bad ol definitions
          (evt: MapEvent | ObjectEvent) => {
            const view = (
              (evt as MapEvent).map || (evt as ObjectEvent).target
            ).getView();
            if (!view || view?.getAnimating() || view?.getInteracting()) {
              return;
            }
            const zoom = view.getZoom();

            // Update the interval between render updates
            if (this.currentZoom !== zoom) {
              this.onZoomEndDebounced(evt);
            }
            this.currentZoom = zoom;

            this.onMoveEndDebounced(evt);
          },
        ),
        this.on('change:visible', (evt: ObjectEvent) => {
          if (evt.target.getVisible()) {
            this.engine.start();
          } else {
            this.engine.stop();
          }
        }),
        this.on('propertychange', (evt: ObjectEvent) => {
          // We apply every property change event related to visiblity to the vectorlayer
          if (
            /(opacity|visible|zIndex|minResolution|maxResolution|minZoom|maxZoom)/.test(
              evt.key,
            )
          ) {
            this.vectorLayer.set(evt.key, evt.target.get(evt.key));
          }
        }),
      );
    }
  }

  cleanVectorLayer() {
    this.vectorLayer?.getSource()?.clear(true);
    this.vectorLayer.getMapInternal()?.removeLayer(this.vectorLayer);
  }

  /**
   * Create a copy of the RealtimeLayer.
   *
   * @param {Object} newOptions Options to override. See constructor.
   * @return {RealtimeLayer} A RealtimeLayer
   * @public
   */
  clone(newOptions: RealtimeLayerOptions): RealtimeLayer {
    return new RealtimeLayer({ ...this.get('options'), ...newOptions });
  }

  createRenderer() {
    return new RealtimeLayerRenderer(this);
  }

  /**
   * Destroy the container of the tracker.
   */
  detachFromMap() {
    unByKey(this.olEventsKeys);
    this.getMapInternal()?.removeLayer(this.vectorLayer);
    this.engine.detachFromMap();
  }

  /**
   * Get the full trajectory of a vehicle as features.
   *
   * @param {string} id A vehicle's id.
   * @returns {Promise<Feature[]>} A list of features representing a full trajectory.
   * @public
   */
  async getFullTrajectory(id: RealtimeTrainId): Promise<Feature[]> {
    const data = await this.engine.api.getFullTrajectory(
      id,
      this.engine.mode,
      this.engine.getGeneralizationLevelByZoom(
        Math.floor(this.getMapInternal()?.getView()?.getZoom() || 0),
      ),
    );
    if (data?.content?.features?.length) {
      return format.readFeatures(data?.content);
    }
    return [];
  }

  /**
   * Get the stop sequences of a vehicle.
   *
   * @param {string} id A vehicle's id.
   * @returns {Promise<RealtimeStopSequence[]>} An array of stop sequences.
   * @public
   */
  async getStopSequences(id: RealtimeTrainId): Promise<RealtimeStopSequence[]> {
    const data = await this.engine.api.getStopSequence(id);
    return data?.content;
  }

  /**
   * Get full trajectory and stop sequences  of a vehicle.
   *
   * @param {RealtimeTrainId} id A vehicle's id.
   * @returns {Promise<{fullTrajectory: Feature[], stopSequences: RealtimeStopSequence[]}>} An object containing the full trajectory and the stop sequences.
   */
  async getTrajectoryInfos(id: RealtimeTrainId): Promise<{
    fullTrajectory: Feature[];
    stopSequences: RealtimeStopSequence[];
  }> {
    // When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
    // Then we combine them in one response.
    const promises = [this.getStopSequences(id), this.getFullTrajectory(id)];
    const [stopSequences, fullTrajectory] = await Promise.all(promises);
    return {
      fullTrajectory: fullTrajectory as Feature[],
      stopSequences: stopSequences as RealtimeStopSequence[],
    };
  }

  getVehicles(filterFunc: FilterFunction) {
    return this.engine.getVehicles(filterFunc);
  }

  getViewState() {
    const mapInternal = this.getMapInternal();
    if (!mapInternal?.getView()) {
      return {};
    }
    const view = mapInternal.getView();
    let extent = view.calculateExtent();

    const layerExtent = this.getExtent();
    if (layerExtent) {
      extent = getIntersection(extent, layerExtent);
      // If there is no intersection we use the layer extent
      if (isEmpty(extent)) {
        extent = layerExtent;
      }
    }

    return {
      center: view.getCenter(),
      extent: extent,
      pixelRatio: this.engine.pixelRatio,
      resolution: view.getResolution(),
      rotation: view.getRotation(),
      size: mapInternal.getSize(),
      visible: this.getVisible(),
      zoom: view.getZoom(),
    };
  }

  highlight(features: Feature | Feature[]) {
    const feat = Array.isArray(features) ? features[0] : features;
    const id: null | string | undefined = feat?.get('train_id') as string;
    if (this.hoverVehicleId !== id) {
      this.hoverVehicleId = id;
      this.engine.renderTrajectories(true);
    }
  }

  /**
   * Highlight the trajectory of journey.
   */
  async highlightTrajectory(
    id: RealtimeTrainId,
  ): Promise<Feature[] | undefined> {
    const promise = new Promise<Feature[] | undefined>((resolve) => {
      this.api.subscribeFullTrajectory(id, this.engine.mode, (data) => {
        if (this.selectedVehicleId === id && data?.content) {
          let features: Feature[] = [];
          if (data?.content?.features?.length) {
            features = format.readFeatures(data?.content);
          }
          this.updateHighlightFeatures(features);
          resolve(features);
        }
      });
    });
    return promise;
    // const features = await this.getFullTrajectory(id);
    // this.updateHighlightFeatures(features);
    // return features;
  }

  onMoveEnd() {
    if (!this.engine.isUpdateBboxOnMoveEnd || !this.getVisible()) {
      return;
    }

    this.engine.setBbox();
  }

  onRealtimeEngineIdle() {
    this.changed();
  }

  /**
   * Callback when the RealtimeEngine has rendered successfully.
   */
  onRealtimeEngineRender(
    renderState: RealtimeRenderState,
    viewState: ViewState,
  ) {
    this.renderedViewState = { ...viewState } as State;
    // @ts-expect-error  - we are in the same class
    const { container } = this.getRenderer()!;
    if (container) {
      container.style.transform = '';
    }
  }

  onZoomEnd() {
    this.engine.onZoomEnd();

    if (!this.engine.isUpdateBboxOnMoveEnd || !this.getVisible()) {
      return;
    }
  }

  /**
   * Remove a trajectory.
   *
   * @param trajectoryOrId
   */
  removeTrajectory(trajectoryOrId: RealtimeTrainId | RealtimeTrajectory) {
    this.engine?.removeTrajectory(trajectoryOrId);
  }

  /**
   * Render the trajectories of the vehicles.
   * @deprecated Use this.engine.renderTrajectories instead.
   */
  renderTrajectories(noInterpolate?: boolean) {
    deprecated(
      'RealtimeLayer.renderTrajectories is deprecated. Use RealtimeLayer.engine.renderTrajectories instead.',
    );
    this.engine.renderTrajectories(noInterpolate);
  }

  select(features: Feature | Feature[]) {
    const feat = Array.isArray(features) ? features[0] : features;
    const id: null | string | undefined = feat?.get('train_id') as string;
    if (this.selectedVehicleId !== id) {
      if (this.selectedVehicleId) {
        this.api.unsubscribeFullTrajectory(this.selectedVehicleId);
      }
      this.cleanVectorLayer();
      this.selectedVehicleId = id;
      this.engine.renderTrajectories(true);
    }

    if (id) {
      void this.highlightTrajectory(id);
    }
  }

  override setMapInternal(map: Map) {
    if (map) {
      super.setMapInternal(map);
      this.attachToMap();
    } else {
      this.detachFromMap();
      super.setMapInternal(map);
    }
  }

  shouldRender() {
    return this.allowRenderWhenAnimating
      ? false
      : this.getMapInternal()?.getView().getAnimating() ||
          this.getMapInternal()?.getView().getInteracting();
  }

  /**
   * Start the rendering.
   *
   * @public
   */
  start() {
    this.engine.start();
  }

  /**
   * Stop the rendering.
   *
   * @public
   */
  stop() {
    this.engine.stop();
  }

  private updateHighlightFeatures(features: Feature[] | undefined) {
    this.cleanVectorLayer();

    if (features?.length) {
      this.vectorLayer?.getSource()?.addFeatures(features);
    }

    if (
      this.vectorLayer.getMapInternal() &&
      this.vectorLayer.getMapInternal() !== this.getMapInternal()
    ) {
      this.vectorLayer.getMapInternal()?.removeLayer(this.vectorLayer);
    }

    // Add the vector layer to the map
    const zIndex = this.getZIndex();
    if (zIndex !== undefined) {
      this.vectorLayer.setZIndex(zIndex - 1);
      if (!this.vectorLayer.getMapInternal()) {
        this.getMapInternal()?.addLayer(this.vectorLayer);
      }
    } else if (!this.vectorLayer.getMapInternal()) {
      const index =
        this.getMapInternal()?.getLayers().getArray().indexOf(this) || 0;
      if (index) {
        this.getMapInternal()?.getLayers().insertAt(index, this.vectorLayer);
      }
    }
    return features;
  }
}

export default RealtimeLayer;
