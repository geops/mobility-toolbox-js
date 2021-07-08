import { Layer as OLLayer, Group } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import Source from 'ol/source/Source';
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

    let oldCenter = null;
    let oldZoom = null;

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
              const { zoom, center } = frameState.viewState;
              oldZoom = oldZoom || zoom;
              oldCenter = oldCenter || center;

              if (zoom !== oldZoom) {
                this.tracker.renderTrajectories(
                  this.currTime,
                  frameState.size,
                  frameState.viewState.resolution,
                  true,
                );
                oldZoom = zoom;
                oldCenter = center;
              } else if (
                oldCenter[0] !== center[0] ||
                oldCenter[1] !== center[1]
              ) {
                const px = this.map.getPixelFromCoordinate(center);
                const oldPx = this.map.getPixelFromCoordinate(oldCenter);
                this.tracker.moveCanvas(px[0] - oldPx[0], px[1] - oldPx[1]);
                oldCenter = center;
              }

              return this.tracker.canvas;
            },
          }),
        ],
      });

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
   * Set the current time, it triggers a rendering of the trajectories.
   * @param {dateString | value} time
   */
  setCurrTime(time) {
    const view = this.map.getView();
    super.setCurrTime(time, this.map.getSize(), view.getResolution());
  }

  /**
   * Trackerlayer is started.
   * @private
   */
  start() {
    super.start(
      this.map.getSize(),
      this.currentZoom,
      this.map.getView().getResolution(),
    );

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
        if (this.map.getView().getInteracting() || !this.isHoverActive) {
          return;
        }
        const [vehicle] = this.getVehiclesAtCoordinate(evt.coordinate);
        this.map.getTargetElement().style.cursor = vehicle ? 'pointer' : 'auto';
        this.tracker.setHoverVehicleId(vehicle && vehicle.id);
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
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol/coordinate~Coordinate} coordinate
   * @returns {ol/Feature~Feature} Vehicle feature.
   * @private
   */
  getVehiclesAtCoordinate(coordinate) {
    const resolution = this.map.getView().getResolution();
    return super.getVehiclesAtCoordinate(coordinate, resolution);
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
