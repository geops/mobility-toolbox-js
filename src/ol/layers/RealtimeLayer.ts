import { DebouncedFunc } from 'lodash';
import debounce from 'lodash.debounce';
import { Map, MapEvent } from 'ol';
import { EventsKey } from 'ol/events';
import Feature, { FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { Vector as VectorLayer } from 'ol/layer';
import Layer from 'ol/layer/Layer';
import { ObjectEvent } from 'ol/Object';
import { unByKey } from 'ol/Observable';
import { Vector as VectorSource } from 'ol/source';
import Source from 'ol/source/Source';
import { State } from 'ol/View';

import { WebSocketAPIMessageEventData } from '../../api/WebSocketAPI';
import { FilterFunction, SortFunction } from '../../common/typedefs';
import RealtimeEngine, {
  RealtimeEngineOptions,
} from '../../common/utils/RealtimeEngine';
import { RealtimeAPI } from '../../maplibre';
import {
  RealtimeFullTrajectory,
  RealtimeMode,
  RealtimeRenderState,
  RealtimeTrainId,
  ViewState,
} from '../../types';
import RealtimeLayerRenderer from '../renderers/RealtimeLayerRenderer';
import { fullTrajectoryStyle } from '../styles';
import defineDeprecatedProperties from '../utils/defineDeprecatedProperties';

const format = new GeoJSON();

export type RealtimeLayerOptions = {
  allowRenderWhenAnimating?: boolean;
  fullTrajectoryStyle?: (
    feature: FeatureLike,
    resolution: number,
    options: any,
  ) => void;
  maxNbFeaturesRequested?: number;
} & RealtimeEngineOptions;

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
 * @see <a href="/api/class/src/api/RealtimeAPI%20js~RealtimeAPI%20html">RealtimeAPI</a>
 * @see <a href="/example/ol-realtime">OpenLayers Realtime layer example</a>
 *
 *
 * @extends {ol/layer/Layer~Layer}
 *
 *
 * @classproperty {boolean} allowRenderWhenAnimating - Allow rendering of the layer when the map is animating.
 * @public
 */
class RealtimeLayer extends Layer {
  allowRenderWhenAnimating?: boolean = false;
  currentZoom?: number;
  engine: RealtimeEngine;
  maxNbFeaturesRequested = 100;
  public olEventsKeys: EventsKey[] = [];
  onMoveEndDebounced: DebouncedFunc<(evt: MapEvent | ObjectEvent) => void>;
  onZoomEndDebounced: DebouncedFunc<(evt: MapEvent | ObjectEvent) => void>;
  renderedViewState: State | undefined;
  vectorLayer: VectorLayer<VectorSource>;

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
      source: new Source({}), // TODO set some attributions
      ...options,
    });

    // For backward compatibility with v2
    defineDeprecatedProperties(this, options);

    this.engine = new RealtimeEngine({
      getViewState: this.getViewState.bind(this),
      onRender: this.onRealtimeEngineRender.bind(this),
      ...options,
    });

    this.allowRenderWhenAnimating = !!options.allowRenderWhenAnimating;

    // We store the layer used to highlight the full Trajectory

    this.vectorLayer = new VectorLayer<VectorSource>({
      source: new VectorSource<Feature>({ features: [] }),
      style: (feature, resolution) => {
        return (options.fullTrajectoryStyle || fullTrajectoryStyle)(
          feature,
          resolution,
          this.engine.styleOptions,
        );
      },
      updateWhileAnimating: this.allowRenderWhenAnimating,
      updateWhileInteracting: true,
    });

    this.onZoomEndDebounced = debounce(this.onZoomEnd, 100);

    this.onMoveEndDebounced = debounce(this.onMoveEnd, 100);
  }

  attachToMap() {
    this.engine.attachToMap();
    const mapInternal = this.getMapInternal();
    if (mapInternal) {
      // If the layer is visible we start  the rendering clock
      if (this.getVisible()) {
        this.engine.start();
      }
      const index = mapInternal.getLayers().getArray().indexOf(this);
      mapInternal.getLayers().insertAt(index, this.vectorLayer);
      this.olEventsKeys.push(
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
   * Get some informations about a trajectory.
   *
   * @param {RealtimeTrainId} id A vehicle's id.
   * @returns
   */
  getTrajectoryInfos(id: RealtimeTrainId) {
    // When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
    // Then we combine them in one response and send them to inherited layers.
    const promises = [
      this.engine.api.getStopSequence(id),
      this.engine.api.getFullTrajectory(
        id,
        this.engine.mode,
        this.engine.getGeneralizationLevelByZoom(
          Math.floor(this.getMapInternal()?.getView()?.getZoom() || 0),
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

  getVehicles(filterFunc: FilterFunction) {
    return this.engine.getVehicles(filterFunc);
  }

  getViewState() {
    const mapInternal = this.getMapInternal();
    if (!mapInternal?.getView()) {
      return {};
    }
    const view = mapInternal.getView();
    return {
      center: view.getCenter(),
      extent: view.calculateExtent(),
      pixelRatio: this.engine.pixelRatio,
      resolution: view.getResolution(),
      rotation: view.getRotation(),
      size: mapInternal.getSize(),
      visible: this.getVisible(),
      zoom: view.getZoom(),
    };
  }

  highlight(feature: Feature) {
    const id = feature?.get('train_id');
    if (this.hoverVehicleId !== id) {
      this.hoverVehicleId = id;
      this.engine.renderTrajectories(true);
    }
  }

  /**
   * Highlight the trajectory of journey.
   */
  highlightTrajectory(id: RealtimeTrainId): Promise<Feature[] | undefined> {
    if (!id) {
      this.vectorLayer?.getSource()?.clear(true);
      return Promise.resolve([]);
    }
    return this.engine.api
      .getFullTrajectory(
        id,
        this.engine.mode,
        this.engine.getGeneralizationLevelByZoom(
          Math.floor(this.getMapInternal()?.getView()?.getZoom() || 0),
        ),
      )
      .then((data: WebSocketAPIMessageEventData<RealtimeFullTrajectory>) => {
        const fullTrajectory = data.content;

        if (!fullTrajectory?.features?.length) {
          return [];
        }
        const features = format.readFeatures(fullTrajectory);
        this.vectorLayer?.getSource()?.clear(true);
        if (features.length) {
          this.vectorLayer?.getSource()?.addFeatures(features);
        }
        return features;
      })
      .catch(() => {
        this.vectorLayer?.getSource()?.clear(true);
        return [];
      });
  }

  onMoveEnd() {
    if (!this.engine.isUpdateBboxOnMoveEnd || !this.getVisible()) {
      return;
    }

    this.engine.setBbox();
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
    const { container } = this.getRenderer() as RealtimeLayerRenderer;
    if (container) {
      container.style.transform = '';
    }
  }

  onZoomEnd() {
    this.engine.onZoomEnd();

    if (!this.engine.isUpdateBboxOnMoveEnd || !this.getVisible()) {
      return;
    }

    if (this.selectedVehicleId) {
      this.highlightTrajectory(this.selectedVehicleId);
    }
  }

  select(feature: Feature) {
    const id = feature?.get('train_id');
    if (this.selectedVehicleId !== id) {
      this.selectedVehicleId = id;
      this.engine.renderTrajectories(true);
    }
    this.highlightTrajectory(id);
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

  get trajectories() {
    return this.engine.trajectories;
  }
}

export default RealtimeLayer;
