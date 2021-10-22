import { Layer as OLLayer, Group } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import Source from 'ol/source/Source';
import { composeCssTransform } from 'ol/transform';
import stringify from 'json-stringify-safe';

import mixin from '../../common/mixins/TrackerLayerMixin';
import Layer from './Layer';

import Worker from '../../common/tracker.worker';

const updateContainerTransform = (layer) => {
  if (layer.workerFrameState) {
    const {
      center,
      resolution,
      rotation,
    } = layer.mainThreadFrameState.viewState;
    const {
      center: renderedCenter,
      resolution: renderedResolution,
      rotation: renderedRotation,
    } = layer.workerFrameState.viewState;

    // eslint-disable-next-line no-param-reassign
    layer.transformContainer.style.transform = composeCssTransform(
      (renderedCenter[0] - center[0]) / resolution,
      (center[1] - renderedCenter[1]) / resolution,
      renderedResolution / resolution,
      renderedResolution / resolution,
      rotation - renderedRotation,
      0,
      0,
    );
  }
};

/**
 * Responsible for loading tracker data.
 *
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
        // Worker provies a new render frame
        requestAnimationFrame(() => {
          if (
            that.map.getView().getInteracting() ||
            that.map.getView().getAnimating()
          ) {
            return;
          }
          const { imageData } = message.data;
          that.canvas.width = imageData.width;
          that.canvas.height = imageData.height;
          that.canvas.getContext('2d').drawImage(imageData, 0, 0);
          // this.canvas.style.transform = message.data.transform;
          that.workerFrameState = message.data.frameState;
          updateContainerTransform(that);
        });
        that.rendering = false;
      }
    };

    /**
     * Boolean that defines if the layer is allow to renderTrajectories when the map is zooming, rotating or poanning true.
     * It's useful to avoid rendering the map when the map is animating or interacting.
     * @type {function}
     */
    this.renderWhenInteracting = options.renderWhenInteracting || (() => false);

    this.olLayer =
      options.olLayer ||
      new Group({
        layers: [
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
                this.canvas.style.left = '0';
                this.canvas.style.transformOrigin = 'top left';
                this.transformContainer.appendChild(this.canvas);
              }
              this.mainThreadFrameState = frameState;

              if (this.workerFrameState) {
                const { resolution } = this.mainThreadFrameState.viewState;
                const {
                  resolution: renderedResolution,
                } = this.workerFrameState.viewState;

                updateContainerTransform(this);

                // Avoid having really big points when zooming fast.
                if (this.canvas && renderedResolution / resolution >= 3) {
                  const context = this.canvas.getContext('2d');
                  context.clearRect(
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height,
                  );
                }

                if (
                  !this.rendering &&
                  this.renderWhenInteracting &&
                  this.renderWhenInteracting(
                    this.mainThreadFrameState,
                    this.workerFrameState,
                  )
                ) {
                  this.renderTrajectories(false);
                } else if (this.rendering) {
                  // eslint-disable-next-line no-param-reassign
                  frameState.animate = true;
                }
              }
              return this.container;
            },
          }),
        ],
      });

    // Options the last render run did happen. If something changes
    // we have to render again
    /** @ignore */
    this.renderState = {
      center: [0, 0],
      zoom: null,
      rotation: 0,
    };

    /**
     * Array of ol events key, returned by on() or once().
     * @type {Array<ol/events~EventsKey>}
     * @private
     */
    this.olEventsKeys = []; // Be careful to not override this value in child classe.
  }

  /**
   * Trackerlayer is started.
   * @private
   */
  start() {
    super.start();

    this.olEventsKeys = [
      this.map.on('moveend', () => {
        const z = this.map.getView().getZoom();

        if (z !== this.currentZoom) {
          /**
           * Current value of the zoom.
           * @type {number}
           */
          this.currentZoom = z;

          // This will restart the timeouts.
          // TODO maybe find a caluclation a bit less approximative one.
          this.requestIntervalSeconds = 200 / z || 1000;
        }
      }),
      // this.map.on('pointermove', (evt) => {
      //   if (
      //     this.map.getView().getInteracting() ||
      //     this.map.getView().getAnimating() ||
      //     !this.isHoverActive
      //   ) {
      //     return;
      //   }
      //   const [vehicle] = this.getVehiclesAtCoordinate(evt.coordinate, 1);
      //   const id = vehicle && vehicle.id;
      //   if (this.hoverVehicleId !== id) {
      //     this.map.getTargetElement().style.cursor = vehicle
      //       ? 'pointer'
      //       : 'auto';
      //     this.hoverVehicleId = id;
      //     this.renderTrajectories();
      //   }
      // }),
    ];
  }

  /**
   * Stop current layer.
   * @private
   */
  stop() {
    super.stop();
    unByKey(this.olEventsKeys);
    this.olEventsKeys = [];
  }

  /**
   * Render the trajectories using current map's size, resolution and rotation.
   * @param {boolean} noInterpolate if true, renders the vehicles without interpolating theirs positions.
   * @overrides
   */
  renderTrajectories(noInterpolate) {
    const view = this.map.getView();
    super.renderTrajectories(
      this.map.getSize(),
      view.getCenter(),
      view.calculateExtent(),
      view.getResolution(),
      view.getRotation(),
      noInterpolate,
    );
  }

  /**
   * Launch renderTrajectories. it avoids duplicating code in renderTrajectories methhod.
   * @private
   */
  renderTrajectoriesInternal(
    size,
    center,
    extent,
    resolution,
    rotation,
    noInterpolate,
  ) {
    if (this.worker) {
      if (!this.tracker) {
        return false;
      }

      const renderTime = this.live ? Date.now() : this.time;

      if (
        this.map.getView().getAnimating() ||
        this.map.getView().getInteracting()
      ) {
        return false;
      }
      // // Avoid useless render before the next tick.
      // if (
      //   this.live
      //   // center[0] === (this.lastRenderCenter || [])[0] &&
      //   // center[1] === (this.lastRenderCenter || [])[1] &&
      //   // resolution === this.lastRenderResolution &&
      //   // rotation === this.lastRenderRotation
      //   // !this.isFirstRender &&
      //   // renderTime - this.lastRenderTime < 150
      // ) {
      //   console.log('la', this.updateTimeDelay);
      //   return false;
      // }

      // if (this.firstRender && this.tracker.trajectories.length > 0) {
      //   console.log('LA', this.mainThreadFrameState);
      //   this.isFirstRender = false;
      // }

      // this.lastRenderCenter = center;
      // this.lastRenderTime = renderTime;
      // this.lastRenderResolution = resolution;
      // this.lastRenderRotation = rotation;

      if (this.mainThreadFrameState) {
        this.rendering = true;
        const frameState = { ...this.mainThreadFrameState };
        delete frameState.layerStatesArray;
        delete frameState.viewState.projection;
        const {
          // center, resolution, rotation,
          zoom,
        } = frameState.viewState;

        if (
          this.map.getView().getInteracting() ||
          this.map.getView().getAnimating()
        ) {
          return false;
        }

        this.worker.postMessage({
          action: 'render',
          time: renderTime,
          size,
          center,
          resolution,
          extent,
          zoom,
          rotation,
          pixelRatio: this.pixelRatio,
          interpolate: !noInterpolate,
          iconScale: this.iconScale,
          hoverVehicleId: this.hoverVehicleId,
          selectedVehicleId: this.selectedVehicleId,
          delayDisplay: this.delayDisplay,
          delayOutlineColor: this.delayOutlineColor,
          useDelayStyle: this.useDelayStyle,
          frameState: JSON.parse(stringify(frameState)),
        });
      }
      return true;
    }

    let isRendered = false;

    isRendered = super.renderTrajectoriesInternal(
      size,
      center,
      extent,
      resolution,
      rotation,
      noInterpolate,
    );

    // We update the current render state.
    if (isRendered) {
      this.renderedViewState = {
        size,
        center,
        extent,
        resolution,
        rotation,
      };

      if (this.transformContainer) {
        this.transformContainer.style.transform = '';
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

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol/coordinate~Coordinate} coordinate
   * @param {number} nb Number of vehicles to return;
   * @returns {Array<ol/Feature~Feature>} Vehicle feature.
   * @override
   */
  getVehiclesAtCoordinate(coordinate, nb) {
    const resolution = this.map.getView().getResolution();
    return super.getVehiclesAtCoordinate(coordinate, resolution, nb);
  }

  /**
   * Create a copy of the TrackerLayer.
   * @param {Object} newOptions Options to override
   * @returns {TrackerLayer} A TrackerLayer
   */
  clone(newOptions) {
    return new TrackerLayer({ ...this.options, ...newOptions });
  }
}

export default TrackerLayer;
