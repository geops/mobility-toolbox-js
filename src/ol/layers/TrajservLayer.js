import Feature from 'ol/Feature';
import { transform as transformCoords } from 'ol/proj';
import { buffer, getWidth } from 'ol/extent';
import { MultiPoint, LineString } from 'ol/geom';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { unByKey } from 'ol/Observable';
import TrackerLayer from './TrackerLayer';
import { getUTCTimeString } from '../../common/timeUtils';
import { getBgColor } from '../../common/trackerConfig';
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
   * @param {Array} stationsCoords Array of station coordinates.
   * @param {LineString|MultiLineString} lineGeometry A LineString or a MultiLineString.
   * @param {string} color The color of the line.
   * @private
   */
  drawFullTrajectory(stationsCoords, lineGeometry, color) {
    // Don't allow white lines, use red instead.
    const vehiculeColor = /#ffffff/i.test(color) ? '#ff0000' : color;
    const vectorSource = this.vectorLayer.getSource();
    vectorSource.clear();

    if (stationsCoords) {
      const geometry = new MultiPoint(stationsCoords);
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
              color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
            }),
          }),
        }),
      );
      vectorSource.addFeatures([aboveStationsFeature, belowStationsFeature]);
    }

    const lineFeat = new Feature({
      geometry: lineGeometry,
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
          color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
          width: 4,
        }),
      }),
    ]);
    vectorSource.addFeature(lineFeat);
  }

  /**
   * Fetch stations information with a trajectory ID
   * @param {number} trajId The ID of the trajectory
   * @returns {Promise<Array<TrajectoryStation>>} A list of stations.
   * @private
   */
  updateTrajectoryStations(trajId) {
    return super.updateTrajectoryStations(trajId).then((trajStations) => {
      /**
       * Array of station coordinates.
       * @type {Array<ol/coordinate~Coordinate>}
       * @ignore
       */
      this.stationsCoords = [];
      trajStations.stations.forEach((station) => {
        this.stationsCoords.push(
          transformCoords(station.coordinates, 'EPSG:4326', 'EPSG:3857'),
        );
      });

      this.highlightTrajectory();
      return trajStations;
    });
  }

  /**
   * Highlight the trajectory of journey.
   * @private
   */
  highlightTrajectory() {
    this.api
      .fetchTrajectoryById(
        this.getParams({
          id: this.journeyId,
          time: getUTCTimeString(new Date()),
        }),
      )
      .then((traj) => {
        const { p: multiLine, t, c } = traj;
        const lineCoords = [];
        multiLine.forEach((line) => {
          line.forEach((point) => {
            lineCoords.push([point.x, point.y]);
          });
        });

        this.drawFullTrajectory(
          this.stationsCoords,
          new LineString(lineCoords),
          c ? `#${c}` : getBgColor(t),
        );
      })
      .catch(() => {
        this.vectorLayer.getSource().clear();
      });
  }

  /**
   * @override
   * * Returns the URL parameters.
   * @param {Object} extraParams Extra parameters
   * @returns {Object}
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
   * @returns {TrajservLayer} A TrajservLayer
   */
  clone(newOptions) {
    return new TrajservLayer({ ...this.options, ...newOptions });
  }
}

export default TrajservLayer;
