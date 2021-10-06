import { Layer as OLLayer, Group } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import Source from 'ol/source/Source';
import { composeCssTransform } from 'ol/transform';

import mixin from '../../common/mixins/TrackerLayerMixin';
import Layer from './Layer';

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

    /**
     * Boolean that defines if the layer is allow to renderTrajectories when this.map.getView().getInterating() id true.
     * It's useful to avoid rendering the map when the map is animating or interacting.
     * @type {function}
     */
    this.renderWhenInteracting = options.renderWhenInteracting || (() => true);

    /**
     * Function to define if we want to allow the render of trajectories when the map is animating. By default the function return true.
     * If it returns false, the canva swill be scaled
     * @type {function}
     */
    this.renderWhenAnimating = options.renderWhenAnimating || (() => true);

    /**
     * Function to define if we want to allow the render of trajectories when the map is zooming. By default the function return true.
     * If it returns false, the canvas will be scaled using css until the next render.
     * @type {function}
     */
    this.renderWhenZooming =
      options.renderWhenZooming ||
      ((viewState, renderedState) => {
        if (viewState.resolution <= renderedState.resolution) {
          this.tracker.clear();
          console.log('tufalsere');
          return false;
        }
        console.log('ture');
        return !this.map.getView().getInteracting();
      });

    /**
     * Function to define if we want to allow the render of trajectories when the map is panning. By default the function return true.
     * If it returns false, the canvas will be moved using css until the next render.
     * @type {function}
     */
    this.renderWhenPanning = options.renderWhenPanning || (() => true);

    /**
     * Function to define if we want to allow the render of trajectories when the map is rotating. By default the function return true.
     * If it returns false, the canvas will be rotated using css until the next render.
     * @type {function}
     */
    this.renderWhenRotating = options.renderWhenRotating || (() => true);

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
                this.tracker.canvas.style.position = 'absolute';
                this.tracker.canvas.style.left = '0';
                this.tracker.canvas.style.transformOrigin = 'top left';
                this.transformContainer.appendChild(this.tracker.canvas);
              }

              if (this.renderedViewState) {
                // Update container tranform
                const { center, resolution, rotation } = frameState.viewState;
                const {
                  center: renderedCenter,
                  resolution: renderedResolution,
                  rotation: renderedRotation,
                } = this.renderedViewState;

                if (
                  !this.map.getView().getInteracting() &&
                  !this.map.getView().getAnimating()
                ) {
                  if (
                    resolution !== renderedResolution &&
                    this.renderWhenZooming
                  ) {
                    const allowRender = this.renderWhenZooming(
                      frameState.viewState,
                      this.renderedViewState,
                    );
                    if (allowRender) {
                      console.log('ici');
                      this.renderTrajectories(true);
                    }
                  } else if (
                    (center[0] !== renderedCenter[0] ||
                      center[1] !== renderedCenter[1]) &&
                    this.renderWhenPanning(
                      frameState.viewState,
                      this.renderedViewState,
                    )
                  ) {
                    console.log('ici2');
                    this.renderTrajectories(true);
                  } else if (
                    rotation !== renderedRotation &&
                    this.renderWhenRotating(
                      frameState.viewState,
                      this.renderedViewState,
                    )
                  ) {
                    console.log('ici3');
                    this.renderTrajectories(true);
                  }
                } else {
                  console.log('ici4');
                  this.transformContainer.style.transform = composeCssTransform(
                    (renderedCenter[0] - center[0]) / resolution,
                    (center[1] - renderedCenter[1]) / resolution,
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
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map A OpenLayers map.
   * @private
   */
  init(map) {
    if (!map) {
      return;
    }

    super.init(map, {
      getPixelFromCoordinate: map.getPixelFromCoordinate.bind(map),
    });
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
          this.startUpdateTime(z);
        }
      }),
      this.map.on('pointermove', (evt) => {
        if (
          this.map.getView().getInteracting() ||
          this.map.getView().getAnimating() ||
          !this.isHoverActive
        ) {
          return;
        }
        const [vehicle] = this.getVehiclesAtCoordinate(evt.coordinate, 1);
        const id = vehicle && vehicle.id;
        if (this.hoverVehicleId !== id) {
          this.map.getTargetElement().style.cursor = vehicle
            ? 'pointer'
            : 'auto';
          this.hoverVehicleId = id;
          this.renderTrajectories();
        }
      }),
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

    if (
      this.map.getView().getAnimating() ||
      this.map.getView().getInteracting()
    ) {
      return;
    }
    super.renderTrajectories(
      this.map.getSize(),
      view.getResolution(),
      view.getRotation(),
      noInterpolate,
    );
  }

  /**
   * Launch renderTrajectories. it avoids duplicating code in renderTrajectories methhod.
   * @private
   */
  renderTrajectoriesInternal(size, resolution, rotation, noInterpolate) {
    const isRendered = super.renderTrajectoriesInternal(
      size,
      resolution,
      rotation,
      noInterpolate,
    );

    // We update the current render state.
    if (isRendered) {
      if (this.transformContainer) {
        this.transformContainer.style.transform = null;
      }
      this.renderedViewState = {
        size,
        center: this.map.getView().getCenter(),
        resolution,
        rotation,
      };
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
