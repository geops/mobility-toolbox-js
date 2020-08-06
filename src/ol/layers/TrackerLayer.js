import { Layer as OLLayer, Group } from 'ol/layer';
import { unByKey } from 'ol/Observable';
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
    const olLayer = new OLLayer({
      render: (frameState) => {
        if (this.tracker && this.tracker.canvas) {
          this.tracker.renderTrajectories(
            this.currTime,
            frameState.size,
            frameState.viewState.resolution,
          );
          return this.tracker.canvas;
        }
        return null;
      },
    });
    // We use a group to be able to add custom vector layer in extended class.
    // For example TrajservLayer use a vectorLayer to display the complete trajectory.
    super({
      olLayer: new Group({ layers: [olLayer] }),
      ...options,
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
   * @param {ol/Map~Map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html Map}
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
   * Trackerlayer is started
   * @param {ol/Map~Map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map}
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
}

export default TrackerLayer;
