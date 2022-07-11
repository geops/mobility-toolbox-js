import GeoJSON from 'ol/format/GeoJSON';
import { Layer as OLLayer, Group, Vector as VectorLayer } from 'ol/layer';
import Source from 'ol/source/Source';
import { composeCssTransform } from 'ol/transform';
import { Vector as VectorSource } from 'ol/source';
import Layer from './Layer';
import mixin from '../../common/mixins/RealtimeLayerMixin';
import { fullTrajectoryStyle } from '../styles';

const format = new GeoJSON();

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
class RealtimeLayer extends mixin(Layer) {
  /**
   * Constructor.
   *
   * @param {Object} options
   * @private
   */
  constructor(options = {}) {
    // We use a group to be able to add custom vector layer in extended class.
    // For example TrajservLayer use a vectorLayer to display the complete trajectory.
    super({
      ...options,
    });

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
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '0';
                this.canvas.style.left = '0';
                this.canvas.style.transformOrigin = 'top left';
                this.transformContainer.appendChild(this.canvas);
              }

              if (this.renderedViewState) {
                const { center, resolution, rotation } = frameState.viewState;
                const {
                  center: renderedCenter,
                  resolution: renderedResolution,
                  rotation: renderedRotation,
                } = this.renderedViewState;

                if (renderedResolution / resolution >= 3) {
                  // Avoid having really big points when zooming fast.
                  const context = this.canvas.getContext('2d');
                  context.clearRect(
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height,
                  );
                } else {
                  const pixelCenterRendered =
                    this.map.getPixelFromCoordinate(renderedCenter);
                  const pixelCenter = this.map.getPixelFromCoordinate(center);
                  this.transformContainer.style.transform = composeCssTransform(
                    pixelCenterRendered[0] - pixelCenter[0],
                    pixelCenterRendered[1] - pixelCenter[1],
                    renderedResolution / resolution,
                    renderedResolution / resolution,
                    rotation - renderedRotation,
                    0,
                    0,
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
      zoom: null,
      rotation: 0,
    };
  }

  attachToMap(map) {
    super.attachToMap(map);
    if (this.map) {
      this.olListenersKeys.push(
        this.map.on(['moveend', 'change:target'], (evt) => {
          const view = this.map.getView();
          if (view.getAnimating() || view.getInteracting()) {
            return;
          }
          const zoom = view.getZoom();

          // Update the interval between render updates
          if (this.currentZoom !== zoom) {
            this.onZoomEnd(evt);
          }
          this.currentZoom = zoom;

          this.onMoveEnd(evt);
        }),
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
  hasFeatureInfoAtCoordinate(coordinate) {
    if (this.map && this.canvas) {
      const context = this.canvas.getContext('2d');
      const pixel = this.map.getPixelFromCoordinate(coordinate);
      return !!context.getImageData(
        pixel[0] * this.pixelRatio,
        pixel[1] * this.pixelRatio,
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
  renderTrajectories(noInterpolate) {
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
  renderTrajectoriesInternal(viewState, noInterpolate) {
    let isRendered = false;

    const blockRendering =
      this.map.getView().getAnimating() || this.map.getView().getInteracting();

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

  /**
   * Return the delay in ms before the next rendering.
   */
  getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getView().getZoom());
  }

  getFeatureInfoAtCoordinate(coordinate, options = {}) {
    const resolution = this.map.getView().getResolution();
    return super.getFeatureInfoAtCoordinate(coordinate, {
      resolution,
      ...options,
    });
  }

  /**
   * On move end we update the websocket with the new bbox.
   *
   * @param {ol/MapEvent~MapEvent} evt Moveend event
   * @private
   * @override
   */
  onMoveEnd() {
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
  onZoomEnd(evt) {
    super.onZoomEnd(evt);
  }

  /**
   * Update the cursor style when hovering a vehicle.
   *
   * @private
   * @override
   */
  onFeatureHover(features, layer, coordinate) {
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
  onFeatureClick(features, layer, coordinate) {
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
  purgeTrajectory(trajectory, extent, zoom) {
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
  setBbox(extent, zoom) {
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
  highlightTrajectory(id) {
    this.api
      .getFullTrajectory(id, this.mode, this.generalizationLevel)
      .then((fullTrajectory) => {
        const vectorSource = this.vectorLayer.getSource();
        vectorSource.clear();

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
  clone(newOptions) {
    return new RealtimeLayer({ ...this.options, ...newOptions });
  }
}

export default RealtimeLayer;
