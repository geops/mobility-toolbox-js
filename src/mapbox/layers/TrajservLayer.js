import { fromLonLat } from 'ol/proj';
import { buffer, getWidth } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import TrackerLayer from './TrackerLayer';
import mixin from '../../common/mixins/TrajservLayerMixin';
import { getUTCTimeString } from '../../common/timeUtils';
import { getSourceCoordinates, getResolution } from '../utils';

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
    this.onMapClick = this.onMapClick.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onMoveEnd = this.onMoveEnd.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
  }

  /**
   * Add the mapbox layer and source to the map.
   *
   * @param {mapboxgl.Map} map A Mapbox map.
   * @param {String} beforeId See [mapboxgl.Map#addLayer](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addlayer) documentation.
   */
  init(map, beforeId) {
    if (!map) {
      return;
    }

    super.init(map);

    const { width, height } = map.getCanvas();
    this.tracker.canvas.width = width;
    this.tracker.canvas.height = height;

    const source = {
      type: 'canvas',
      canvas: this.tracker.canvas,
      coordinates: getSourceCoordinates(map),
      // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
      animate: true,
      attribution: this.copyrights,
    };

    this.beforeId = beforeId;
    this.layer = {
      id: this.key,
      type: 'raster',
      source: this.key,
      layout: {
        visibility: this.visible ? 'visible' : 'none',
      },
      paint: {
        'raster-opacity': 1,
        'raster-fade-duration': 0,
        'raster-resampling': 'nearest', // important otherwise it looks blurry
      },
    };
    map.addSource(this.key, source);
    map.addLayer(this.layer, this.beforeId);

    this.listeners = [this.on('change:visible', this.onVisibilityChange)];
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
    this.map.on('click', this.onMapClick);
    this.map.on('move', this.onMove);
    this.map.on('moveend', this.onMoveEnd);
  }

  stop() {
    if (this.map) {
      this.map.off('click', this.onClick);
      this.map.off('move', this.onMove);
      this.map.off('moveend', this.onMoveEnd);
    }
    super.stop();
  }

  onVisibilityChange() {
    if (this.visible && !this.map.getLayer(this.key)) {
      this.map.addLayer(this.layer, this.beforeId);
    } else if (this.map.getLayer(this.key)) {
      this.map.removeLayer(this.key);
    }
    // We can't use setLayoutProperty it triggers an error probably a bug in mapbox
    // this.map.setLayoutProperty(
    //   this.key,
    //   'visibilty',
    //   this.visible ? 'visible' : 'none',
    // );
  }

  /**
   * Callback on 'move' event.
   * @private
   */
  onMove() {
    this.map.getSource(this.key).setCoordinates(getSourceCoordinates(this.map));

    const { width, height } = this.map.getCanvas();
    this.tracker.renderTrajectories(
      this.currTime,
      [width, height],
      getResolution(this.map),
    );
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
   * Callback on 'mouseclick' event.
   * @param {mapboxgl.MapMouseEvent} evt
   * @private
   */
  onMapClick(evt) {
    if (!this.clickCallbacks.length) {
      return;
    }

    const [vehicle] = this.getVehiclesAtCoordinate(
      fromLonLat([evt.lngLat.lng, evt.lngLat.lat]),
      1,
    );

    if (vehicle) {
      /**
       * Id of the selected vehicle
       * @type {string}
       */
      this.selectedVehicleId = vehicle.id;
      /** @ignore */
      this.journeyId = vehicle.journeyIdentifier;
      this.updateTrajectoryStations(this.selectedVehicleId).then(
        (vehicleWithStations) => {
          /**
           * Array of station coordinates.
           * @type {Array<Array<number>>} Array of coordinates.
           */
          this.stationsCoords = [];
          vehicleWithStations.stations.forEach((station) => {
            this.stationsCoords.push(fromLonLat(station.coordinates));
          });
          this.clickCallbacks.forEach((callback) =>
            callback({ ...vehicle, ...vehicleWithStations }, this, evt),
          );
        },
      );
    } else {
      this.selectedVehicleId = null;
      this.clickCallbacks.forEach((callback) => callback(null, this, evt));
    }
  }

  /**
   * @override
   * * Returns the URL parameters.
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

  /** @ignore */
  defaultStyle(props) {
    const zoom = this.map.getZoom();
    return super.defaultStyle(props, zoom);
  }

  /**
   * Draw the trajectory as a line with points for each stop.
   * @param {Array} stationsCoords Array of station coordinates.
   * @param {ol/geom/LineString~LineString|ol/geom/MultiLineString~MultiLineString} lineGeometry A LineString or a MultiLineString.
   * @param {string} color The color of the line.
   * @private
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  drawFullTrajectory(stationsCoords, lineGeometry, color) {
    // eslint-disable-next-line no-console
    console.log('to be implemented');
    // Don't allow white lines, use red instead.
    // const vehiculeColor = /#ffffff/i.test(color) ? '#ff0000' : color;
    // const vectorSource = this.olLayer.getSource();
    // vectorSource.clear();
    // if (stationsCoords) {
    //   const geometry = new MultiPoint(stationsCoords);
    //   const aboveStationsFeature = new Feature(geometry);
    //   aboveStationsFeature.setStyle(
    //     new Style({
    //       zIndex: 1,
    //       image: new Circle({
    //         radius: 5,
    //         fill: new Fill({
    //           color: '#000000',
    //         }),
    //       }),
    //     }),
    //   );
    //   const belowStationsFeature = new Feature(geometry);
    //   belowStationsFeature.setStyle(
    //     new Style({
    //       zIndex: 4,
    //       image: new Circle({
    //         radius: 4,
    //         fill: new Fill({
    //           color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
    //         }),
    //       }),
    //     }),
    //   );
    //   vectorSource.addFeatures([aboveStationsFeature, belowStationsFeature]);
    // }
    // const lineFeat = new Feature({
    //   geometry: lineGeometry,
    // });
    // lineFeat.setStyle([
    //   new Style({
    //     zIndex: 2,
    //     stroke: new Stroke({
    //       color: '#000000',
    //       width: 6,
    //     }),
    //   }),
    //   new Style({
    //     zIndex: 3,
    //     stroke: new Stroke({
    //       color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
    //       width: 4,
    //     }),
    //   }),
    // ]);
    // vectorSource.addFeature(lineFeat);
  }

  /**
   * Highlight the trajectory of journey.
   * @param {String} journeyId The id of the journey.
   * @private
   */
  highlightTrajectory(journeyId) {
    this.api
      .fetchTrajectoryById({
        id: journeyId,
        time: getUTCTimeString(new Date()),
      })
      // .then((traj) => {
      // const { p: multiLine, t, c } = traj;
      // const lineCoords = [];
      // multiLine.forEach((line) => {
      //   line.forEach((point) => {
      //     lineCoords.push([point.x, point.y]);
      //   });
      // });
      // this.drawFullTrajectory(
      //   this.stationsCoords,
      //   new LineString(lineCoords),
      //   c ? `#${c}` : getBgColor(t),
      // );
      // })
      .catch(() => {
        if (this.map.getLayer('highlight-trajectory')) {
          this.map.removeLayer('highlight-trajectory');
        }
      });
  }
}

export default TrajservLayer;
