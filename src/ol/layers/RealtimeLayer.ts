import GeoJSON from 'ol/format/GeoJSON';
import { Layer as OLLayer, Group, Vector as VectorLayer } from 'ol/layer';
import Source from 'ol/source/Source';
import { composeCssTransform } from 'ol/transform';
import { Vector as VectorSource } from 'ol/source';
import Feature, { FeatureLike } from 'ol/Feature';
import { MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import type { State } from 'ol/View';
import Layer from './Layer';
import mixin, {
  RealtimeLayerMixinOptions,
} from '../../common/mixins/RealtimeLayerMixin';
import { fullTrajectoryStyle } from '../styles';
import {
  AnyMap,
  LayerGetFeatureInfoResponse,
  RealtimeFullTrajectory,
  RealtimeTrainId,
} from '../../types';
import { RealtimeTrajectory } from '../../api/typedefs';
import { WebSocketAPIMessageEventData } from '../../common/api/WebSocketAPI';
// import Worker from '../../common/tracker.worker';

/** @private */
const format = new GeoJSON();

export type OlRealtimeLayerOptions = RealtimeLayerMixinOptions & {
  fullTrajectoryStyle: (
    feature: FeatureLike,
    resolution: number,
    options: any,
  ) => void;
  allowRenderWhenAnimating?: boolean;
};

const updateContainerTransform = (
  layer: RealtimeLayer,
  renderedViewState: State,
  mainThreadViewState: State,
) => {
  if (renderedViewState) {
    const { center, resolution, rotation } = mainThreadViewState;
    const {
      center: renderedCenter,
      resolution: renderedResolution,
      rotation: renderedRotation,
    } = renderedViewState;
    const pixelCenterRendered =
      layer.map.getPixelFromCoordinate(renderedCenter);
    const pixelCenter = layer.map.getPixelFromCoordinate(center);
    // eslint-disable-next-line no-param-reassign
    layer.transformContainer.style.transform = composeCssTransform(
      pixelCenterRendered[0] - pixelCenter[0],
      pixelCenterRendered[1] - pixelCenter[1],
      renderedResolution / resolution,
      renderedResolution / resolution,
      rotation - renderedRotation,
      0,
      0,
    );
  }
};

const wworker = new Worker(
  new URL('../../common/tracker.worker.js', import.meta.url),
);
/**
 * Responsible for loading and display data from a Realtime service.
 *
 * @example
 * import { RealtimeLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new RealtimeLayer({
 *   url: [yourUrl],
 *   apiKey: [yourApiKey],
 * });
 *
 *
 * @see <a href="/api/class/src/api/RealtimeAPI%20js~RealtimeAPI%20html">RealtimeAPI</a>
 *
 * @extends {Layer}
 * @implements {UserInteractionsLayerInterface}
 * @implements {RealtimeLayerInterface}
 */
// @ts-ignore
class RealtimeLayer extends mixin(Layer) {
  allowRenderWhenAnimating?: boolean = false;

  /**
   * Constructor.
   *
   * @param {Object} options
   * @private
   */
  constructor(options: OlRealtimeLayerOptions) {
    // We use a group to be able to add custom vector layer in extended class.
    // For example TrajservLayer use a vectorLayer to display the complete trajectory.
    super({
      ...options,
    });

    // Worker that render trajectories.
    this.worker = wworker;

    // Worker messaging and actions
    this.worker.onmessage = this.onWorkerMessage.bind(this);

    this.allowRenderWhenAnimating = !!options.allowRenderWhenAnimating;

    /** @ignore */
    this.olLayer =
      options.olLayer ||
      new Group({
        layers: [
          new VectorLayer({
            source: new VectorSource({ features: [] }),
            style: (feature, resolution) => {
              return (options.fullTrajectoryStyle || fullTrajectoryStyle)(
                feature,
                resolution,
                this.styleOptions,
              );
            },
          }),
          new OLLayer({
            source: new Source({}),
            render: (frameState) => {
              if (!this.container) {
                this.container = document.createElement('div');
                this.container.style.position = 'absolute';
                this.container.style.width = '100%';
                this.container.style.height = '100%';
                this.transformContainer = document.createElement('div');
                this.transformContainer.style.position = 'absolute';
                this.transformContainer.style.width = '100%';
                this.transformContainer.style.height = '100%';
                this.container.appendChild(this.transformContainer);
                if (this.canvas) {
                  (this.canvas as HTMLCanvasElement).style.position =
                    'absolute';
                  (this.canvas as HTMLCanvasElement).style.top = '0';
                  (this.canvas as HTMLCanvasElement).style.left = '0';
                  (this.canvas as HTMLCanvasElement).style.transformOrigin =
                    'top left';
                  this.transformContainer.appendChild(this.canvas);
                }
              }

              this.mainThreadViewState = frameState.viewState;

              if (this.renderedViewState) {
                const { resolution } = frameState.viewState;
                const { resolution: renderedResolution } =
                  this.renderedViewState;

                if (renderedResolution / resolution >= 3) {
                  // Avoid having really big points when zooming fast.
                  const context = this.canvas?.getContext('2d');
                  context?.clearRect(
                    0,
                    0,
                    this.canvas?.width as number,
                    this.canvas?.height as number,
                  );
                } else {
                  updateContainerTransform(
                    this,
                    this.renderedViewState,
                    frameState.viewState,
                  );
                }
              }
              return this.container;
            },
          }),
        ],
      });

    // We store the layer used to highlight the full Trajectory
    this.vectorLayer = this.olLayer.getLayers().item(0);

    // Options the last render run did happen. If something changes
    // we have to render again
    /** @ignore */
    this.renderState = {
      center: [0, 0],
      zoom: undefined,
      rotation: 0,
    };
  }

  attachToMap(map: AnyMap) {
    super.attachToMap(map);
    if (this.map) {
      this.olListenersKeys.push(
        ...this.map.on(
          ['moveend', 'change:target'],
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
              this.onZoomEnd();
            }
            this.currentZoom = zoom;

            this.onMoveEnd(evt);
          },
        ),
      );
    }
  }

  /**
   * Destroy the container of the tracker.
   */
  detachFromMap() {
    super.detachFromMap();
    this.container = null;
  }

  /**
   * Detect in the canvas if there is data to query at a specific coordinate.
   * @param {ol/coordinate~Coordinate}  coordinate The coordinate to test
   * @returns
   */
  hasFeatureInfoAtCoordinate(coordinate: Coordinate) {
    if (this.map && this.canvas) {
      const context = this.canvas.getContext('2d', {
        willReadFrequently: true,
      });
      const pixel = this.map.getPixelFromCoordinate(coordinate);
      return !!context?.getImageData(
        pixel[0] * (this.pixelRatio || 1),
        pixel[1] * (this.pixelRatio || 1),
        1,
        1,
      ).data[3];
    }
    return false;
  }

  /**
   * Render the trajectories using current map's size, resolution and rotation.
   * @param {boolean} noInterpolate if true, renders the vehicles without interpolating theirs positions.
   * @overrides
   */
  // @ts-ignore
  renderTrajectories(noInterpolate: boolean) {
    if (!this.map) {
      return;
    }

    const view = this.map.getView();
    super.renderTrajectories(
      {
        size: this.map.getSize(),
        center: this.map.getView().getCenter(),
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

    if (!blockRendering && this.worker && this.mainThreadViewState) {
      this.worker.postMessage({
        action: 'render',
        viewState: {
          ...viewState,
          // time: this.live ? Date.now() : this.time?.getTime(),
        },
        options: {
          noInterpolate:
            (viewState.zoom || 0) < this.minZoomInterpolation
              ? true
              : noInterpolate,
          hoverVehicleId: this.hoverVehicleId,
          selectedVehicleId: this.selectedVehicleId,
          iconScale: this.iconScale,
          delayDisplay: this.delayDisplay,
          delayOutlineColor: this.delayOutlineColor,
          useDelayStyle: this.useDelayStyle,
        },
      });
    } else if (!this.worker) {
      // Don't render the map when the map is animating or interacting.
      isRendered = blockRendering
        ? false
        : super.renderTrajectoriesInternal(viewState, noInterpolate);

      // We update the current render state.
      if (isRendered) {
        this.renderedViewState = { ...viewState };

        if (this.transformContainer) {
          this.transformContainer.style.transform = '';
        }
      }
    }
    return isRendered;
  }

  /**
   * Return the delay in ms before the next rendering.
   */
  getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getView().getZoom());
  }

  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
    options = {},
  ): Promise<LayerGetFeatureInfoResponse> {
    if (!this.map || !this.map.getView()) {
      return Promise.resolve({
        layer: this,
        features: [],
        coordinate,
      });
    }

    const resolution = this.map.getView().getResolution();
    return super.getFeatureInfoAtCoordinate(coordinate, {
      resolution,
      ...options,
    });
  }

  /**
   * On move end we update the websocket with the new bbox.
   *
   * @private
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMoveEnd(evt: MapEvent | ObjectEvent) {
    if (this.visible && this.isUpdateBboxOnMoveEnd) {
      this.setBbox();
    }

    if (
      this.visible &&
      this.isUpdateBboxOnMoveEnd &&
      this.userClickInteractions &&
      this.selectedVehicleId
    ) {
      this.highlightTrajectory(this.selectedVehicleId);
    }
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

    if (this.visible && this.isUpdateBboxOnMoveEnd) {
      this.setBbox();
    }

    if (
      this.visible &&
      this.isUpdateBboxOnMoveEnd &&
      this.userClickInteractions &&
      this.selectedVehicleId
    ) {
      this.highlightTrajectory(this.selectedVehicleId);
    }
  }

  /**
   * Update the cursor style when hovering a vehicle.
   *
   * @private
   * @override
   */
  onFeatureHover(
    features: Feature[],
    layer: RealtimeLayer,
    coordinate: Coordinate,
  ) {
    super.onFeatureHover(features, layer, coordinate);
    this.map.getTargetElement().style.cursor = features.length
      ? 'pointer'
      : 'auto';
  }

  /**
   * Display the complete trajectory of the vehicle.
   *
   * @private
   * @override
   */
  onFeatureClick(
    features: Feature[],
    layer: RealtimeLayer,
    coordinate: Coordinate,
  ) {
    super.onFeatureClick(features, layer, coordinate);
    if (!features.length && this.vectorLayer) {
      this.vectorLayer.getSource().clear();
    }
    if (this.selectedVehicleId) {
      this.highlightTrajectory(this.selectedVehicleId);
    }
  }

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
    return super.purgeTrajectory(
      trajectory,
      extent || this.map.getView().calculateExtent(),
      zoom || this.map.getView().getZoom(),
    );
  }

  /**
   * Send the current bbox to the websocket
   *
   * @private
   */
  setBbox(extent?: [number, number, number, number], zoom?: number) {
    let newExtent = extent;
    let newZoom = zoom;
    if (!newExtent && this.isUpdateBboxOnMoveEnd) {
      newExtent = extent || this.map.getView().calculateExtent();
      newZoom = Math.floor(this.map.getView().getZoom());
    }
    super.setBbox(newExtent, newZoom);
  }

  /**
   * Highlight the trajectory of journey.
   * @private
   */
  highlightTrajectory(id: RealtimeTrainId) {
    this.api
      .getFullTrajectory(id, this.mode, this.generalizationLevel)
      .then((data: WebSocketAPIMessageEventData<RealtimeFullTrajectory>) => {
        const fullTrajectory = data.content;
        this.vectorLayer.getSource().clear();

        if (
          !fullTrajectory ||
          !fullTrajectory.features ||
          !fullTrajectory.features.length
        ) {
          return;
        }
        const features = format.readFeatures(fullTrajectory);
        this.vectorLayer.getSource().addFeatures(features);
      });
  }

  /**
   * Create a copy of the RealtimeLayer.
   * @param {Object} newOptions Options to override
   * @return {RealtimeLayer} A RealtimeLayer
   */
  clone(newOptions: OlRealtimeLayerOptions) {
    return new RealtimeLayer({ ...this.options, ...newOptions });
  }

  onWorkerMessage(message: any) {
    if (message.data.action === 'requestRender') {
      // Worker requested a new render frame
      this.map.render();
    } else if (this.canvas && message.data.action === 'rendered') {
      if (
        !this.allowRenderWhenAnimating &&
        (this.map.getView().getInteracting() ||
          this.map.getView().getAnimating())
      ) {
        return;
      }
      // Worker provides a new render frame
      // requestAnimationFrame(() => {
      //   if (
      //     !that.renderWhenInteracting(
      //       that.mainThreadFrameState.viewState,
      //       that.renderedViewState,
      //     ) &&
      //     (that.map.getView().getInteracting() ||
      //       that.map.getView().getAnimating())
      //   ) {
      //     return;
      //   }
      const { imageData, viewState } = message.data;
      this.canvas.width = imageData.width;
      this.canvas.height = imageData.height;
      if ((this.canvas as HTMLCanvasElement)?.style) {
        (this.canvas as HTMLCanvasElement).style.transform = ``;
        (this.canvas as HTMLCanvasElement).style.width = `${
          this.canvas.width / (this.pixelRatio || 1)
        }px`;
        (this.canvas as HTMLCanvasElement).style.height = `${
          this.canvas.height / (this.pixelRatio || 1)
        }px`;
      }
      this.renderedViewState = viewState;
      updateContainerTransform(this, viewState, this.mainThreadViewState);
      this.canvas?.getContext('2d')?.drawImage(imageData, 0, 0);
    }
  }
}

export default RealtimeLayer;
