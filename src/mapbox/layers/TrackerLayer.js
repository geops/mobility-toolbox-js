import { toLonLat, fromLonLat } from 'ol/proj';
import Layer from '../../common/layers/Layer';
import mixin from '../../common/mixins/TrackerLayerMixin';
import { getResolution } from '../utils';
import GetVehicleAtCoordinateW from '../../common/workers/getVehicleAtCoordinate.worker';

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
    this.getVehicleAtCoordinateWorker = new GetVehicleAtCoordinateW();

    const canvas = map.getCanvas();

    super.init(map, {
      width: canvas.width / this.pixelRatio,
      height: canvas.height / this.pixelRatio,
      getPixelFromCoordinate: (coord) => {
        const [lng, lat] = toLonLat(coord);
        const { x, y } = this.map.project({ lng, lat });
        return [x, y];
      },
    });
  }

  /**
   * Start updating vehicles position.
   *
   * @listens {mapboxgl.map.event:zoomend} Listen to zoom end event.
   * @listens {mapboxgl.map.event:mousemove} Listen to mousemove end.
   * @override
   */
  start() {
    super.start();

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
   * Render the trajectories using current map's size, resolution and rotation.
   * @param {boolean} noInterpolate if true, renders the vehicles without interpolating theirs positions.
   * @overrides
   */
  renderTrajectories(noInterpolate) {
    const canvas = this.map.getCanvas();
    super.renderTrajectories(
      [canvas.width / this.pixelRatio, canvas.height / this.pixelRatio],
      getResolution(this.map),
      this.map.getBearing(),
      noInterpolate,
    );
  }

  /**
   * Return the delay in ms before the next rendering.
   */
  getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getZoom());
  }

  /**
   * Returns an array of vehicles located at the given coordinate.
   *
   * @param {Array<number>} coordinate
   * @param {number} nb Number of vehicles to return;
   * @returns {Array<ol/Feature~Feature>} Array of vehicle.
   * @override
   */
  getVehiclesAtCoordinate(coordinate) {
    const res = getResolution(this.map);

    // const ext = buffer([...coordinate, ...coordinate], 10 * res);
    const trajectories = this.tracker.getTrajectories();
    this.getVehicleAtCoordinateWorker.postMessage(
      JSON.stringify([trajectories, coordinate, res]),
    );
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
      this.renderTrajectories();
    }
  }
}

export default TrackerLayer;
