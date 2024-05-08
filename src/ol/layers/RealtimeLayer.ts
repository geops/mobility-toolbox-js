import GeoJSON from 'ol/format/GeoJSON';
import { Vector as VectorLayer } from 'ol/layer';
import Source from 'ol/source/Source';
import { Vector as VectorSource } from 'ol/source';
import Feature, { FeatureLike } from 'ol/Feature';
import { Map, MapEvent } from 'ol';
import { ObjectEvent } from 'ol/Object';
import debounce from 'lodash.debounce';
import Layer from 'ol/layer/Layer';
import RealtimeLayerMixin, {
  RealtimeLayerMixinOptions,
} from '../../common/mixins/RealtimeLayerMixin';
import { fullTrajectoryStyle } from '../styles';
import {
  RealtimeFullTrajectory,
  RealtimeTrainId,
  ViewState,
} from '../../types';
import { RealtimeTrajectory } from '../../api/typedefs';
import { WebSocketAPIMessageEventData } from '../../api/WebSocketAPI';
import MobilityLayerMixin from '../mixins/MobilityLayerMixin';
import RealtimeLayerRenderer from '../renderers/RealtimeLayerRenderer';

/** @private */
const format = new GeoJSON();

export type RealtimeLayerOptions = RealtimeLayerMixinOptions & {
  fullTrajectoryStyle?: (
    feature: FeatureLike,
    resolution: number,
    options: any,
  ) => void;
  allowRenderWhenAnimating?: boolean;
};

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
 *
 * @extends {ol/layer/Layer~Layer}
 *
 * @classproperty {boolean} allowRenderWhenAnimating - Allow rendering of the layer when the map is animating.
 * @public
 */
// @ts-ignore
class RealtimeLayer extends RealtimeLayerMixin(MobilityLayerMixin(Layer)) {
  /** @private */
  allowRenderWhenAnimating?: boolean = false;

  /**
   * Constructor.
   *
   * @param {RealtimeLayerOptions} options
   * @param {boolean} [options.allowRenderWhenAnimating=false] Allow rendering of the layer when the map is animating.
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {string} [options.url="wss://api.geops.io/tracker-ws/v1/"] The geOps Realtime API url.
   *
   */
  constructor(options: RealtimeLayerOptions) {
    // We use a group to be able to add custom vector layer in extended class.
    // For example TrajservLayer use a vectorLayer to display the complete trajectory.
    super({
      source: new Source({}), // TODO set some attributions
      ...options,
    });

    /** @private */
    this.allowRenderWhenAnimating = !!options.allowRenderWhenAnimating;

    // We store the layer used to highlight the full Trajectory
    /** @private */
    this.vectorLayer = new VectorLayer({
      updateWhileAnimating: this.allowRenderWhenAnimating,
      updateWhileInteracting: true,
      source: new VectorSource({ features: [] }),
      style: (feature, resolution) => {
        return (options.fullTrajectoryStyle || fullTrajectoryStyle)(
          feature,
          resolution,
          this.styleOptions,
        );
      },
    });

    // Options the last render run did happen. If something changes
    // we have to render again
    /** @private */
    this.renderState = {
      center: [0, 0],
      zoom: undefined,
      rotation: 0,
    };

    /** @private */
    this.onZoomEndDebounced = debounce(this.onZoomEnd, 100);

    /** @private */
    this.onMoveEndDebounced = debounce(this.onMoveEnd, 100);
  }

  /**
   * @private
   */
  createRenderer() {
    return new RealtimeLayerRenderer(this);
  }

  /** @private */
  override attachToMap(map: Map) {
    super.attachToMap(map);
    if (this.map) {
      // If the layer is visible we start  the rendering clock
      if (this.visible) {
        this.start();
      }
      // @ts-expect-error - bad ts check RealtimeLayer is a BaseLayer
      const index = this.map.getLayers().getArray().indexOf(this);
      this.map.getLayers().insertAt(index, this.vectorLayer);
      this.olListenersKeys.push(
        ...this.map.on(
          ['moveend', 'change:target'],
          // @ts-expect-error - bad ol definitions
          (evt: MapEvent | ObjectEvent) => {
            const view = (
              (evt as MapEvent).map || (evt as ObjectEvent).target
            ).getView();
            if (view.getAnimating() || view.getInteracting()) {
              return;
            }
            const zoom = view.getZoom();

            // Update the interval between render updates
            if (this.currentZoom !== zoom) {
              this.onZoomEndDebounced(evt);
            }
            /** @private */
            this.currentZoom = zoom;

            this.onMoveEndDebounced(evt);
          },
        ),
        this.on('change:visible', (evt: ObjectEvent) => {
          if ((evt.target as any).visible) {
            this.start();
          } else {
            this.stop();
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
   * Destroy the container of the tracker.
   * @private
   */
  override detachFromMap() {
    this.map?.removeLayer(this.vectorLayer);
    super.detachFromMap();
  }

  /**
   * Render the trajectories using current map's size, resolution and rotation.
   * @param {boolean} noInterpolate if true, renders the vehicles without interpolating theirs positions.
   * @overrides
   * @private
   */
  // @ts-ignore
  renderTrajectories(noInterpolate: boolean) {
    if (!this.map) {
      return;
    }

    const view = this.map.getView();

    // it could happen that the view is set but without center yet,
    // so the calcualteExtent will trigger an error.
    if (!view.getCenter()) {
      return;
    }

    super.renderTrajectories(
      {
        size: this.map.getSize(),
        center: view.getCenter(),
        extent: view.calculateExtent(),
        resolution: view.getResolution(),
        rotation: view.getRotation(),
        zoom: view.getZoom(),
        pixelRatio: this.pixelRatio,
      },
      noInterpolate,
    );
  }

  /**
   * Launch renderTrajectories. it avoids duplicating code in renderTrajectories methhod.
   * @private
   * @override
   */
  renderTrajectoriesInternal(viewState: ViewState, noInterpolate: boolean) {
    if (!this.map) {
      return false;
    }
    let isRendered = false;

    const blockRendering = this.allowRenderWhenAnimating
      ? false
      : this.map.getView().getAnimating() ||
        this.map.getView().getInteracting();

    // Don't render the map when the map is animating or interacting.
    isRendered = blockRendering
      ? false
      : super.renderTrajectoriesInternal(viewState, noInterpolate);

    // We update the current render state.
    if (isRendered) {
      /** @private */
      this.renderedViewState = { ...viewState };
      // @ts-expect-error - we are in the same class
      const { container } = this.getRenderer() as RealtimeLayerRenderer;
      if (container) {
        container.style.transform = '';
      }
    }
    return isRendered;
  }

  /**
   * Return the delay in ms before the next rendering.
   * @private
   */
  getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getView().getZoom());
  }

  /**
   * On move end we update the websocket with the new bbox.
   *
   * @private
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMoveEnd(evt: MapEvent | ObjectEvent) {
    if (!this.isUpdateBboxOnMoveEnd || !this.visible) {
      return;
    }

    this.setBbox();
  }

  /**
   * Function called on moveend event only when the zoom has changed.
   *
   * @param {ol/MapEvent~MapEvent} evt Moveend event.
   * @private
   * @override
   */
  // eslint-disable-next-line no-unused-vars
  onZoomEnd() {
    super.onZoomEnd();

    if (!this.isUpdateBboxOnMoveEnd || !this.visible) {
      return;
    }

    if (this.selectedVehicleId) {
      this.highlightTrajectory(this.selectedVehicleId);
    }
  }

  highlight(feature: Feature) {
    this.highlightVehicle(feature?.get('train_id'));
  }

  select(feature: Feature) {
    this.selectVehicle(feature?.get('train_id'));
    this.highlightTrajectory(feature?.get('train_id'));
  }

  // /**
  //  * Update the cursor style when hovering a vehicle.
  //  *
  //  * @private
  //  * @override
  //  */
  // onFeatureHover(
  //   features: Feature[],
  //   layer: RealtimeLayer,
  //   coordinate: Coordinate,
  // ) {
  //   super.onFeatureHover(features, layer, coordinate);
  //   this.map.getTargetElement().style.cursor = features.length
  //     ? 'pointer'
  //     : 'auto';
  // }

  // /**
  //  * Display the complete trajectory of the vehicle.
  //  *
  //  * @private
  //  * @override
  //  */
  // onFeatureClick(
  //   features: Feature[],
  //   layer: RealtimeLayer,
  //   coordinate: Coordinate,
  // ) {
  //   super.onFeatureClick(features, layer, coordinate);
  //   this.highlightTrajectory(this.selectedVehicleId);
  // }

  /**
   * Remove the trajectory form the list if necessary.
   *
   * @private
   */
  purgeTrajectory(
    trajectory: RealtimeTrajectory,
    extent: [number, number, number, number],
    zoom: number,
  ) {
    const center = this.map.getView().getCenter();
    if (!extent && !center) {
      // In that case the view is not zoomed yet so we can't calculate the extent of the map,
      // it will trigger a js error on calculateExtent function.
      return false;
    }
    return super.purgeTrajectory(
      trajectory,
      extent || this.map.getView().calculateExtent(),
      zoom || this.map.getView().getZoom() || 0,
    );
  }

  /**
   * Send the current bbox to the websocket
   *
   * @private
   */
  setBbox(extent?: [number, number, number, number], zoom?: number) {
    super.setBbox(
      extent ||
        (this.map.getView().calculateExtent() as [
          number,
          number,
          number,
          number,
        ]),
      zoom || this.map.getView().getZoom() || 0,
    );
  }

  /**
   * Highlight the trajectory of journey.
   * @private
   */
  highlightTrajectory(id: RealtimeTrainId): Promise<Feature[] | undefined> {
    if (!id) {
      this.vectorLayer.getSource().clear(true);
      return Promise.resolve([]);
    }
    return this.api
      .getFullTrajectory(
        id,
        this.mode,
        this.getGeneralizationLevelByZoom(
          Math.floor(this.map?.getView()?.getZoom() || 0),
        ),
      )
      .then((data: WebSocketAPIMessageEventData<RealtimeFullTrajectory>) => {
        const fullTrajectory = data.content;

        if (!fullTrajectory?.features?.length) {
          return [];
        }
        const features = format.readFeatures(fullTrajectory) as Feature[];
        this.vectorLayer.getSource().clear(true);
        if (features.length) {
          this.vectorLayer.getSource().addFeatures(features);
        }
        return features;
      })
      .catch(() => {
        this.vectorLayer.getSource().clear(true);
        return [];
      });
  }

  /**
   * Create a copy of the RealtimeLayer.
   * @param {Object} newOptions Options to override
   * @return {RealtimeLayer} A RealtimeLayer
   */
  clone(newOptions: RealtimeLayerOptions): RealtimeLayer {
    return new RealtimeLayer({ ...this.options, ...newOptions });
  }
}

export default RealtimeLayer;
