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

    this.onMapMoveEnd = this.onMapMoveEnd.bind(this);
    this.onMapMouseMove = this.onMapMouseMove.bind(this);
  }

  /**
   * Initialize the layer.
   * @param {mapboxgl.Map} map A Mapbox [Map](https://docs.mapbox.com/mapbox-gl-js/api/map/).
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
      this.start(null, z);
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
