import { toLonLat, fromLonLat } from 'ol/proj';
import Layer from '../../common/layers/Layer';
import mixin from '../../common/mixins/TrackerLayerMixin';
import { getResolution } from '../utils';

/**
 * Responsible for loading tracker data.
 *
 * @extends {Layer}
 * @implements {TrackerLayerInterface}
 */
class TrackerLayer extends mixin(Layer) {
  constructor(options = {}) {
    super({
      ...options,
    });

    /** @ignores */
    this.onMapZoomEnd = this.onMapZoomEnd.bind(this);
    /** @ignores */
    this.onMapMouseMove = this.onMapMouseMove.bind(this);
  }

  /**
   * Initialize the layer.
   *
   * @param {mapboxgl.Map} map A [mapbox Map](https://docs.mapbox.com/mapbox-gl-js/api/map/).
   * @override
   */
  init(map) {
    if (!map) {
      return;
    }
    const { width, height } = map.getCanvas();

    super.init(map, {
      width,
      height,
      getPixelFromCoordinate: (coord) => {
        const pixelRatio = window.devicePixelRatio || 1;
        const [lng, lat] = toLonLat(coord);
        const { x, y } = this.map.project({ lng, lat });
        return [x * pixelRatio, y * pixelRatio];
      },
    });
  }

  /**
   * Set the current time, it triggers a rendering of the trajectories.
   *
   * @param {Date} time  The current time.
   */
  setCurrTime(time) {
    const canvas = this.map.getCanvas();
    super.setCurrTime(
      time,
      [canvas.width, canvas.height],
      getResolution(this.map),
      !this.map.isMoving() && !this.map.isRotating() && !this.map.isZooming(),
    );
  }

  /**
   * Start updating vehicles position.
   *
   * @listens {mapboxgl.map.event:zoomend} Listen to zoom end event, see {@link TrackerLayer#onMapZoomEnd}.
   * @listens {mapboxgl.map.event:mousemove} Listen to mousemove end, see {@link TrackerLayer#onMapMouseMove}.
   * @param {mapboxgl.Map} map A [mapbox Map](https://docs.mapbox.com/mapbox-gl-js/api/map/).
   * @override
   */
  start() {
    const canvas = this.map.getCanvas();
    super.start(
      [canvas.width, canvas.height],
      this.map.getZoom(),
      getResolution(this.map),
    );

    this.map.on('zoomend', this.onMapZoomEnd);

    if (this.isHoverActive) {
      this.map.on('mousemove', this.onMapMouseMove);
    }
  }

  /**
   * Stop updating vehicles position, and unlisten events.
   *
   * @override
   */
  stop() {
    super.stop();
    if (this.map) {
      this.map.off('zoomend', this.onMapZoomEnd);
      this.map.off('mousemove', this.onMapMouseMove);
    }
  }

  /**
   * Returns an array of vehicles located at the given coordinate.
   *
   * @param {number[2]} coordinate
   * @returns {Object[]} Array of vehicle.
   * @override
   */
  getVehiclesAtCoordinate(coordinate) {
    const resolution = getResolution(this.map);
    return super.getVehiclesAtCoordinate(coordinate, resolution);
  }

  /**
   * On zoomend we adjust the time interval of the update of vehicles positions.
   *
   * @private
   */
  onMapZoomEnd() {
    this.startUpdateTime(this.map.getZoom());
  }

  /**
   * On mousemove, we detect if a vehicle is heovered then updates the cursor's style.
   *
   * @param {mapboxgl.MapMouseEvent} evt Map's mousemove event.
   * @private
   */
  onMapMouseMove(evt) {
    if (
      this.map.isMoving() ||
      this.map.isRotating() ||
      this.map.isZooming() ||
      !this.isHoverActive
    ) {
      this.map.getContainer().style.cursor = 'auto';
      return;
    }
    const [vehicle] = this.getVehiclesAtCoordinate(
      fromLonLat([evt.lngLat.lng, evt.lngLat.lat]),
    );
    this.map.getContainer().style.cursor = vehicle ? 'pointer' : 'auto';
    this.tracker.setHoverVehicleId(vehicle && vehicle.id);
  }
}

export default TrackerLayer;
