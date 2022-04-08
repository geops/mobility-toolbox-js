import { Layer as OLLayer, Group, Vector as VectorLayer } from 'ol/layer';
import Source from 'ol/source/Source';
import { composeCssTransform } from 'ol/transform';
import stringify from 'json-stringify-safe';
import { Vector as VectorSource } from 'ol/source';
import mixin from '../../common/mixins/TrackerLayerMixin';

import Layer from './Layer';

import Worker from '../../common/tracker.worker';

const updateContainerTransform = (layer) => {
  if (layer.renderedViewState) {
    const { center, resolution, rotation } =
      layer.mainThreadFrameState.viewState;
    const {
      center: renderedCenter,
      resolution: renderedResolution,
      rotation: renderedRotation,
    } = layer.renderedViewState;
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
      layer.canvas.width,
      layer.canvas.height,
    );
  }
};

/**
 * Responsible for loading tracker data.
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 * @implements {TrackerLayerInterface}
 */
class TrackerLayer extends mixin(Layer) {
  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {boolean} options.useDelayStyle Set the delay style.
   * @private
   */
  constructor(options = {}) {
    // We use a group to be able to add custom vector layer in extended class.
    // For example TrajservLayer use a vectorLayer to display the complete trajectory.
    super({
      ...options,
    });
    this.firstRender = true;
    const that = this;

    // Worker that render trajectories.
    this.worker = new Worker();
    // Worker messaging and actions
    this.worker.onmessage = (message) => {
      if (message.data.action === 'requestRender') {
        // Worker requested a new render frame
        that.map.render();
      } else if (that.canvas && message.data.action === 'rendered') {
        if (
          that.map.getView().getInteracting() ||
          that.map.getView().getAnimating()
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
        const { imageData, nbRenderedTrajectories } = message.data;
        this.nbRenderedTrajectories = nbRenderedTrajectories;
        that.canvas.width = imageData.width;
        that.canvas.height = imageData.height;
        this.canvas.style.transform = ``;
        this.canvas.style.width = `${this.canvas.width / this.pixelRatio}px`;
        this.canvas.style.height = `${this.canvas.height / this.pixelRatio}px`;
        // this.canvas.style.transform = message.data.transform;
        that.renderedViewState = message.data.frameState.viewState;
        updateContainerTransform(that);
        that.canvas.getContext('2d').drawImage(imageData, 0, 0);
        // });
        that.rendering = false;
      }
    };

    /** @ignore */
    this.olLayer =
      options.olLayer ||
      new Group({
        layers: [
          new VectorLayer({
            source: new VectorSource({ features: [] }),
          }),
          new OLLayer({
            source: new Source({}),
            render: (frameState) => {
              if (!this.tracker || !this.tracker.canvas) {
                return null;
              }

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
                this.canvas = document.createElement('canvas');
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '0';
                this.canvas.style.left = '0';
                this.canvas.style.transformOrigin = 'top left';
                this.transformContainer.appendChild(this.canvas);
              }
              this.mainThreadFrameState = frameState;
              if (this.renderedViewState) {
                const { resolution } = frameState.viewState;
                const { resolution: renderedResolution } =
                  this.renderedViewState;

                if (renderedResolution / resolution >= 3) {
                  // Avoid having really big points when zooming fast.
                  this.canvas
                    .getContext('2d')
                    .clearRect(0, 0, this.canvas.width, this.canvas.height);

                  // } else {
                  //   const pixelCenterRendered =
                  //     this.map.getPixelFromCoordinate(renderedCenter);
                  //   const pixelCenter = this.map.getPixelFromCoordinate(center);
                  //   this.transformContainer.style.transform = composeCssTransform(
                  //     pixelCenterRendered[0] - pixelCenter[0],
                  //     pixelCenterRendered[1] - pixelCenter[1],
                  //     renderedResolution / resolution,
                  //     renderedResolution / resolution,
                  //     rotation - renderedRotation,
                  //     0,
                  //     0,
                  //     this.canvas.width,
                  //     this.canvas.height,
                  //   );
                } else {
                  updateContainerTransform(this);
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

  init(map) {
    super.init(map);
    if (this.map) {
      this.olListenersKeys.push(
        this.map.on('moveend', (evt) => {
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
  terminate() {
    super.terminate();
    this.container = null;
  }

  /**
   * Detect in the canvas if there is data to query at a specific coordinate.
   * @param {ol/coordinate~Coordinate}  coordinate The coordinate to test
   * @returns
   */
  hasFeatureInfoAtCoordinate(coordinate) {
    if (this.map && this.tracker && this.tracker.canvas) {
      const context = this.tracker.canvas.getContext('2d');
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

    if (this.worker && this.mainThreadFrameState) {
      const frameState = { ...this.mainThreadFrameState };
      delete frameState.layerStatesArray;
      delete frameState.viewState.projection;
      this.worker.postMessage({
        action: 'render',
        frameState: JSON.parse(stringify(frameState)),
        viewState,
        options: {
          noInterpolate,
          iconScale: this.iconScale,
          hoverVehicleId: this.hoverVehicleId,
          selectedVehicleId: this.selectedVehicleId,
          delayDisplay: this.delayDisplay,
          delayOutlineColor: this.delayOutlineColor,
          useDelayStyle: this.useDelayStyle,
        },
      });
    } else {
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
  }

  /**
   * Return the delay in ms before the next rendering.
   */
  getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getView().getZoom());
  }

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol/coordinate~Coordinate} coordinate
   * @param {number} nb Number of vehicles to return;
   * @return {Array<ol/Feature~Feature>} Vehicle feature.
   * @override
   */
  getVehiclesAtCoordinate(coordinate, nb) {
    const resolution = this.map.getView().getResolution();
    return super.getVehiclesAtCoordinate(coordinate, resolution, nb);
  }

  getFeatureInfoAtCoordinate(coordinate, options = {}) {
    if (!this.hasFeatureInfoAtCoordinate(coordinate)) {
      return Promise.resolve({ features: [], layer: this, coordinate });
    }
    const resolution = this.map.getView().getResolution();
    return super.getFeatureInfoAtCoordinate(coordinate, {
      resolution,
      ...options,
    });
  }

  /**
   * Function called on moveend event.
   * To be defined in inherited classes
   *
   * @param {ol/MapEvent~MapEvent} evt Moveend event.
   * @private
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  onMoveEnd(evt) {}

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
  }

  /**
   * Create a copy of the TrackerLayer.
   * @param {Object} newOptions Options to override
   * @return {TrackerLayer} A TrackerLayer
   */
  clone(newOptions) {
    return new TrackerLayer({ ...this.options, ...newOptions });
  }
}

export default TrackerLayer;
