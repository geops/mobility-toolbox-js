import { toLonLat, fromLonLat } from 'ol/proj';
import CommonLayer from '../../common/layers/Layer';
import TrackerMixin from '../../common/mixins/TrackerMixin';
import { getResolution } from '../utils';

/**
 * Responsible for loading tracker data.
 *
 * @example
 * import { TrackerLayer } from 'mobility-toolbox-js/src/mapbox';
 *
 * @class
 *
 * @param {Object} options
 * @param {boolean} options.useDelayStyle Set the delay style.
 * @param {string} options.onClick Callback function on feature click.
 */
class TrackerLayer extends TrackerMixin(CommonLayer) {
  constructor(options = {}) {
    super({
      ...options,
    });

    this.onMapMoveEnd = this.onMapMoveEnd.bind(this);
    this.onMapMouseMove = this.onMapMouseMove.bind(this);
  }

  /**
   * Initialize the layer.
   * @param {mapboxgl.map} map A Mapbox [Map](https://docs.mapbox.com/mapbox-gl-js/api/map/).
   * @private
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    const { width, height } = map.getCanvas();
    super.initTracker({
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
   * @param {dateString | value} time
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
   * @param {ol.map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map}
   * @private
   */
  start() {
    this.currentZoom = this.map.getZoom();
    const canvas = this.map.getCanvas();
    super.start(
      [canvas.width, canvas.height],
      this.currentZoom,
      getResolution(this.map),
    );

    this.map.on('moveend', this.onMapMoveEnd);

    if (this.isHoverActive) {
      this.map.on('mousemove', this.onMapMouseMove);
    }
  }

  /**
   * Stop updating vehicles position.
   * @private
   */
  stop() {
    super.stop();
    if (this.map) {
      this.map.off('moveend', this.onMapMoveEnd);
      this.map.off('mousemove', this.onMapMouseMove);
    }
  }

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol.coordinate} coordinate
   * @returns {ol.feature | null} Vehicle feature
   * @private
   */
  getVehiclesAtCoordinate(coordinate) {
    const resolution = getResolution(this.map);
    return super.getVehiclesAtCoordinate(coordinate, resolution);
  }

  /**
   * @private
   */
  onMapMoveEnd() {
    const z = this.map.getZoom();

    if (z !== this.currentZoom) {
      this.currentZoom = z;
      this.startUpdateTime(z);
    }
  }

  /**
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
