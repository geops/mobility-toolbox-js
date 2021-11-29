import { fromLonLat } from 'ol/proj';
import { buffer, getWidth } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import TrackerLayer from './TrackerLayer';
import mixin from '../../common/mixins/TrajservLayerMixin';

/**
 * Responsible for loading and display data from a Trajserv service.
 *
 * @example
 * import { TrajservLayer } from 'mobility-toolbox-js/mapbox';
 *
 * const layer = new TrajservLayer({
 *   url: 'https://api.geops.io/tracker/v1',
 *   apiKey: [yourApiKey],
 * });
 *
 * @see <a href="/api/class/src/api/trajserv/TrajservAPI%20js~TrajservAPI%20html">TrajservAPI</a>
 * @see <a href="/example/mapbox-tracker">Mapbox tracker example</a>
 *
 * @extends {TrackerLayer}
 * @implements {TrajservLayerInterface}
 */
class TrajservLayer extends mixin(TrackerLayer) {
  constructor(options = {}) {
    super({ ...options });
    this.onMove = this.onMove.bind(this);
    this.onMoveEnd = this.onMoveEnd.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
  }

  /**
   * Remove the mapbox layer and the mapbox source.
   *
   * @override
   */
  terminate() {
    if (this.map) {
      this.listeners.forEach((listener) => {
        unByKey(listener);
      });
      this.map.removeLayer(this.key);
      this.map.removeSource(this.key);
    }
    super.terminate();
  }

  start() {
    if (!this.map) {
      return;
    }
    super.start();
    this.map.on('move', this.onMove);
    this.map.on('moveend', this.onMoveEnd);
  }

  stop() {
    if (this.map) {
      this.map.off('move', this.onMove);
      this.map.off('moveend', this.onMoveEnd);
    }
    super.stop();
  }

  /**
   * Callback on 'moveend' event.
   * @private
   */
  onMoveEnd() {
    this.updateTrajectories();
    if (this.selectedVehicleId && this.journeyId) {
      this.highlightTrajectory();
    }
  }

  /**
   * Returns the URL parameters.
   * @param {Object} extraParams Extra parameters
   * @returns {Object}
   * @private
   */
  getParams(extraParams = {}) {
    const bounds = this.map.getBounds().toArray();
    const southWest = fromLonLat(bounds[0]);
    const northEast = fromLonLat(bounds[1]);
    const ext = [...southWest, ...northEast];
    const bbox = buffer(ext, getWidth(ext) / 10).join(',');
    const zoom = this.map.getZoom();

    return super.getParams({
      ...extraParams,
      bbox,
      s: zoom < 10 ? 1 : 0,
      z: zoom,
    });
  }

  /**
   * Draw the trajectory as a line with points for each stop.
   *
   * @param {Array} stationsCoords Array of station coordinates in EPSG:4326.
   * @param {Array<ol/coordinate~Coordinate>} lineCoords A list of coordinates in EPSG:3857.
   * @param {string} color The color of the line.
   * @private
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  drawFullTrajectory(stationsCoords, lineCoords, color) {
    // eslint-disable-next-line no-console
    console.log('to be implemented');
  }
}

export default TrajservLayer;
