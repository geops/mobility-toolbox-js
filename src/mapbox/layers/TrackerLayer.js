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
   * Update the icon scale if the window (and probably the canvas) is resized.
   * @private
   */
  updateIconScale(canvas) {
    this.tracker.setIconScale(canvas.width / canvas.clientWidth);
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

    const canvas = map.getCanvas();
    const iconScale = canvas.width / canvas.clientWidth;
    map.on('resize', this.updateIconScale.bind(this, canvas));

    super.init(map, {
      width: canvas.width,
      height: canvas.height,
      iconScale,
      getPixelFromCoordinate: (coord) => {
        const pixelRatio = window.devicePixelRatio || 1;
        const [lng, lat] = toLonLat(coord);
        const { x, y } = this.map.project({ lng, lat });
        return [x * pixelRatio, y * pixelRatio];
      },
    });
  }

  terminate() {
    if (this.map) {
      this.map.off('resize', this.updateIconScale);
    }
    return super.terminate();
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
   * @listens {mapboxgl.map.event:zoomend} Listen to zoom end event.
   * @listens {mapboxgl.map.event:mousemove} Listen to mousemove end.
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
   * @param {Array<number>} coordinate
   * @param {number} nb Number of vehicles to return;
   * @returns {Array<ol/Feature~Feature>} Array of vehicle.
   * @override
   */
  getVehiclesAtCoordinate(coordinate, nb) {
    const resolution = getResolution(this.map);
    return super.getVehiclesAtCoordinate(coordinate, resolution, nb);
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
      1,
    );

    const id = vehicle && vehicle.id;
    if (this.hoverVehicleId !== id) {
      this.map.getContainer().style.cursor = vehicle ? 'pointer' : 'auto';
      this.hoverVehicleId = id;
      // We doesn´t wait the next render, we force it.
      this.renderTrajectories(this.currTime);
    }
  }
}

export default TrackerLayer;
