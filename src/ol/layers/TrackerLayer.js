import { Layer as OLLayer, Group } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import Source from 'ol/source/Source';
import mixin from '../../common/mixins/TrackerLayerMixin';
import Layer from './Layer';
import GetVehicleAtCoordinateW from '../../common/workers/getVehicleAtCoordinate.worker';

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
     * Function to define  when allowing the render of trajectories depending on the zoom level. Default the fundtion return true.
     * It's useful to avoid rendering the map when the map is animating or interacting.
     * @type {function}
     */
    this.renderWhenZooming = options.renderWhenZooming || (() => true);

    /**
     * Function to define  when allowing the render of trajectories depending on the rotation. Default the fundtion return true.
     * It's useful to avoid rendering the map when the map is animating or interacting.
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
              const { zoom, center, rotation } = frameState.viewState;

              if (
                zoom !== this.renderState.zoom ||
                rotation !== this.renderState.rotation
              ) {
                this.renderState.zoom = zoom;
                this.renderState.center = center;
                this.renderState.rotation = rotation;

                if (
                  (zoom !== this.renderState.zoom &&
                    !this.renderWhenZooming(zoom)) ||
                  (rotation !== this.renderState.rotation &&
                    !this.renderWhenRotating(rotation))
                ) {
                  this.tracker.clear();
                  return this.tracker.canvas;
                }

                this.renderTrajectories(true);
              } else if (
                this.renderState.center[0] !== center[0] ||
                this.renderState.center[1] !== center[1]
              ) {
                const px = this.map.getPixelFromCoordinate(center);
                const oldPx = this.map.getPixelFromCoordinate(
                  this.renderState.center,
                );

                // We move the canvas to avoid re render the trajectories
                const oldLeft = parseFloat(this.tracker.canvas.style.left);
                const oldTop = parseFloat(this.tracker.canvas.style.top);
                this.tracker.canvas.style.left = `${
                  oldLeft - (px[0] - oldPx[0])
                }px`;
                this.tracker.canvas.style.top = `${
                  oldTop - (px[1] - oldPx[1])
                }px`;

                this.renderState.center = center;
                this.renderState.rotation = rotation;
              }

              return this.tracker.canvas;
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
    this.getVehicleAtCoordinateWorker = new GetVehicleAtCoordinateW();

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

    this.getVehicleAtCoordinateWorker.onmessage = (e) => {
      const [vehicle] = e.data;
      // eslint-disable-next-line no-console
      console.log(vehicle);
      this.map.getTargetElement().style.cursor = vehicle ? 'pointer' : 'auto';
      this.tracker.setHoverVehicleId(vehicle && vehicle.id);
    };
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
      view.getResolution(),
      view.getRotation(),
      noInterpolate,
    );
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
  getVehiclesAtCoordinate(coordinate) {
    const res = this.map.getView().getResolution();
    const trajectories = this.tracker.getTrajectories();
    this.getVehicleAtCoordinateWorker.postMessage(
      JSON.stringify([trajectories, coordinate, res]),
    );
    // const vehicles = [];
    // for (let i = 0; i < (trajectories || []).length; i += 1) {
    //   if (
    //     trajectories[i].coordinate &&
    //     containsCoordinate(ext, trajectories[i].coordinate)
    //   ) {
    //     vehicles.push(trajectories[i]);
    //   }
    // }

    // return vehicles;
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
