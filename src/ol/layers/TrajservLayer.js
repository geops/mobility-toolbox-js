import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { buffer, getWidth } from 'ol/extent';
import { MultiPoint, LineString } from 'ol/geom';
import { Style, Fill, Stroke, Circle } from 'ol/style';
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
 *
 * @see <a href="/api/class/src/api/trajserv/TrajservAPI%20js~TrajservAPI%20html">TrajservAPI</a>
 * @see <a href="/example/ol-tracker">OL tracker example</a>
 *
 * @extends {TrackerLayer}
 * @implements {TrajservLayerInterface}
 * @deprecated Use {@link TralisLayer} instead.
 */
class TrajservLayer extends mixin(TrackerLayer) {
  /**
   * Start the layer.
   * @override
   */
  start() {
    if (!this.map) {
      return;
    }
    super.start();
    /**
     * Array of ol events key, returned by on() or once().
     * @type {Array<ol/events~EventsKey>}
     * @ignore
     */
    this.olEventsKeys = [
      this.map.on('movestart', () => {
        this.abortFetchTrajectories();
      }),
      this.map.on('moveend', this.onMoveEnd.bind(this)),
    ];
  }

  stop() {
    unByKey(this.olEventsKeys);
    super.stop();
  }

  /**
   * Callback on 'moveend' event.
   * @private
   */
  onMoveEnd() {
    const z = this.map.getView().getZoom();

    if (z !== this.currentZoom) {
      /**
       * Current value of the zoom.
       * @type {number}
       * @ignore
       */
      this.currentZoom = z;

      // This will restart the timeouts.
      // TODO maybe find a calculation a bit less approximative.
      /** @ignore */
      this.requestIntervalSeconds = 200 / z || 1000;
    }

    this.abortFetchTrajectories();
    if (
      !this.map.getView().getAnimating() &&
      !this.map.getView().getInteracting()
    ) {
      this.updateTrajectories();
    }

    if (this.selectedVehicleId && this.journeyId) {
      this.highlightTrajectory();
    }
  }

  /**
   * Draw the trajectory as a line with points for each stop.
   * @param {Array} stationsCoords Array of station coordinates in epsg:4326.
   * @param {Array<ol/coordinate~Coordinate>} lineCoords A list of coordinates.
   * @param {string} color The color of the line.
   * @private
   */
  drawFullTrajectory(stationsCoords, lineCoords, color) {
    const vectorSource = this.vectorLayer.getSource();
    vectorSource.clear();

    // Add station points
    if (stationsCoords) {
      const geometry = new MultiPoint(
        stationsCoords.map((coords) => fromLonLat(coords)),
      );
      const aboveStationsFeature = new Feature(geometry);
      aboveStationsFeature.setStyle(
        new Style({
          zIndex: 1,
          image: new Circle({
            radius: 5,
            fill: new Fill({
              color: '#000000',
            }),
          }),
        }),
      );
      const belowStationsFeature = new Feature(geometry);
      belowStationsFeature.setStyle(
        new Style({
          zIndex: 4,
          image: new Circle({
            radius: 4,
            fill: new Fill({
              color,
            }),
          }),
        }),
      );
      vectorSource.addFeatures([aboveStationsFeature, belowStationsFeature]);
    }

    // Add line.
    if (lineCoords) {
      const lineFeat = new Feature({
        geometry: new LineString(lineCoords),
      });
      lineFeat.setStyle([
        new Style({
          zIndex: 2,
          stroke: new Stroke({
            color: '#000000',
            width: 6,
          }),
        }),
        new Style({
          zIndex: 3,
          stroke: new Stroke({
            color,
            width: 4,
          }),
        }),
      ]);
      vectorSource.addFeature(lineFeat);
    }
  }

  /**
   * @override
   * * Returns the URL parameters.
   * @param {Object} extraParams Extra parameters
   * @return {Object}
   * @private
   */
  getParams(extraParams = {}) {
    const ext = this.map.getView().calculateExtent();
    const bbox = buffer(ext, getWidth(ext) / 10).join(',');
    const zoom = this.map.getView().getZoom();

    return super.getParams({
      ...extraParams,
      bbox,
      s: zoom < 10 ? 1 : 0,
      z: zoom,
    });
  }

  /**
   * Create a copy of the TrajservLayer.
   * @param {Object} newOptions Options to override
   * @return {TrajservLayer} A TrajservLayer
   */
  clone(newOptions) {
    return new TrajservLayer({ ...this.options, ...newOptions });
  }
}

export default TrajservLayer;
