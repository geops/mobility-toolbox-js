import Feature from 'ol/Feature';
import { transform as transformCoords } from 'ol/proj';
import { buffer, getWidth } from 'ol/extent';
import { Point, MultiPoint, LineString } from 'ol/geom';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import TrackerLayer from './TrackerLayer';
import { getUTCTimeString } from '../../common/timeUtils';
import { getBgColor } from '../../common/trackerConfig';
import mixin from '../../common/mixins/TrajservLayerMixin';

/**
 * Responsible for loading and display data from a Trajserv service.
 *
 * @example
 * import { TrajservLayer } from 'mobility-toolbox-js/src/mapbox';
 *
 * const layer = new TrajservLayer({
 *   url: 'https://api.geops.io/tracker/v1',
 *   apiKey: [yourApiKey],
 * });
 *
 * @see https://mobility-toolbox-js.geops.de/api/class/src/api/trajserv/TrajservAPI.js~TrajservAPI.html
 * @see https://mobility-toolbox-js.geops.de/examples/ol-tracker
 *
 * @extends {TrackerLayer}
 * @implements {TrajservLayerInterface}
 */
class TrajservLayer extends mixin(TrackerLayer) {
  constructor(options) {
    super(options);
    Object.defineProperties(this, {
      vectorLayer: {
        value: new VectorLayer({
          source: new VectorSource({ features: [] }),
        }),
      },
    });
  }

  init(map) {
    if (!map) {
      return;
    }

    map.addLayer(this.vectorLayer);
    super.init(map);
  }

  terminate() {
    if (this.map) {
      this.map.removeLayer(this.vectorLayer);
    }
    super.terminate();
  }

  start() {
    if (!this.map) {
      return;
    }
    super.start();
    this.olEventsKeys = [
      ...this.olEventsKeys,
      this.map.on('singleclick', this.onMapClick.bind(this)),
      this.map.on('moveend', this.onMoveEnd.bind(this)),
    ];
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
   * Callback on 'singleclick' event.
   * @private
   */
  onMapClick(evt) {
    if (!this.clickCallbacks.length) {
      return;
    }

    const [vehicle] = this.getVehiclesAtCoordinate(evt.coordinate);
    const features = [];

    if (vehicle) {
      const geom = vehicle.coordinate ? new Point(vehicle.coordinate) : null;
      features.push(new Feature({ geometry: geom, ...vehicle }));

      if (features.length) {
        this.selectedVehicleId = features[0].get('id');
        this.journeyId = features[0].get('journeyIdentifier');
        this.updateTrajectoryStations(this.selectedVehicleId).then(
          (trajStations) => {
            this.clickCallbacks.forEach((callback) =>
              callback(trajStations, this, evt),
            );
          },
        );
      }
    } else {
      this.selectedVehicleId = null;
      this.vectorLayer.getSource().clear();
      this.clickCallbacks.forEach((callback) => callback(null, this, evt));
    }
  }

  /**
   * Draw the trajectory as a line with points for each stop.
   * @param {Array} stationsCoords Array of station coordinates.
   * @param {<LineString|MultiLineString} lineGeometry A LineString or a MultiLineString.
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
   * @private
   */
  updateTrajectoryStations(trajId) {
    return super.updateTrajectoryStations(trajId).then((trajStations) => {
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

  defaultStyle(props) {
    const zoom = this.map.getView().getZoom();
    return super.defaultStyle(props, zoom);
  }
}

export default TrajservLayer;
