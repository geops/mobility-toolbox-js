import qs from 'query-string';
import { fromLonLat } from 'ol/proj';
import { buffer, getWidth } from 'ol/extent';
import { LineString } from 'ol/geom';
import TrackerLayer from './TrackerLayer';
import { getDateString, getUTCTimeString } from '../../common/timeUtils';
import {
  getRadius,
  getBgColor,
  getDelayColor,
  getDelayText,
  getTextColor,
  getTextSize,
} from '../../common/trackerConfig';
import { TrajservAPI } from '../../api';
import { getSourceCoordinates } from '../utils';

/**
 * Responsible for loading tracker data from Trajserv.
 * @class
 * @inheritDoc
 * @param {Object} [options] Layer options.
 * @param {string} [url = https://api.geops.io/tracker] Tracker url.
 * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
 * @param {number} options.delayDisplay delay from which the time is always display on the feature (in milliseconds).
 * @param {Array.<string>|string} options.regexPublishedLineName Regex filter for line name. This filter has a higher prio over publishedLineName.
 * @param {Array.<string>|string} options.publishedLineName Filter by line name, string: 'ICE',  list: 's1,s2,s9,s10,s15'
 * @param {Array.<string>|string} options.tripNumber Filter by trip number, bus in zurich: '2068', list of buses in Zurich: '2068,3003,3451,3953'
 * @param {Array.<string>|string} options.operator Filter by operator, string: 'sbb', list: '(vbz\|zsg)'
 */
class TrajservLayer extends TrackerLayer {
  /**
   * Create a filter based on train and operator
   * @param {string} line
   * @param {string} route
   * @param {string} operator
   * @param {string} regexLine
   * @private
   */
  static createFilter(line, trip, operator, regexLine) {
    const filterList = [];

    if (!line && !trip && !operator && !regexLine) {
      return null;
    }

    if (regexLine) {
      const regexLineList =
        typeof regexLine === 'string' ? [regexLine] : regexLine;
      const lineFilter = (t) =>
        regexLineList.some((tr) => new RegExp(tr, 'i').test(t.name));
      filterList.push(lineFilter);
    }

    if (line) {
      const lineFiltersList = typeof line === 'string' ? line.split(',') : line;
      const lineList = lineFiltersList.map((l) =>
        l.replace(/\s+/g, '').toUpperCase(),
      );
      const lineFilter = (l) =>
        lineList.some((filter) => filter === l.name.toUpperCase());
      filterList.push(lineFilter);
    }

    if (trip) {
      const tripFilters = typeof trip === 'string' ? trip.split(',') : trip;
      const tripList = tripFilters.map((rt) => parseInt(rt, 10));
      const tripFilter = (t) => {
        const tripId = parseInt(t.routeIdentifier.split('.')[0], 10);
        return tripList.some((tr) => tr === tripId);
      };
      filterList.push(tripFilter);
    }

    if (operator) {
      const operatorList = typeof operator === 'string' ? [operator] : operator;
      const operatorFilter = (t) =>
        operatorList.some((op) => new RegExp(op, 'i').test(t.operator));
      filterList.push(operatorFilter);
    }

    return (t) => {
      for (let i = 0; i < filterList.length; i += 1) {
        if (!filterList[i](t)) {
          return false;
        }
      }
      return true;
    };
  }

  constructor(options = {}) {
    super({ ...options });

    this.options = options;
    this.showVehicleTraj =
      options.showVehicleTraj !== undefined ? options.showVehicleTraj : true;
    this.delayDisplay = options.delayDisplay || 300000;
    this.requestIntervalSeconds = 3;
    this.useDelayStyle = options.useDelayStyle || false;
    this.delayOutlineColor = options.delayOutlineColor || '#000000';
    this.width = options.width;
    this.height = options.height;
    this.api = new TrajservAPI({ url: options.url, apiKey: options.apiKey });
    this.onMapClick = this.onMapClick.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onMoveEnd = this.onMoveEnd.bind(this);
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol.map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map)
   * @private
   */
  init(map, beforeLayerId) {
    super.init(map);
    if (!this.map) {
      return;
    }

    // Sort the trajectories.
    if (this.sortFc) {
      this.setSort(this.sortFc);
    } else if (this.useDelayStyle) {
      // Automatic sorting depending on delay, higher delay on top.
      this.setSort((a, b) => {
        if (a.delay === null) return 1;
        return a.delay < b.delay ? 1 : -1;
      });
    }

    const { width, height } = map.getCanvas();
    this.tracker.canvas.width = width;
    this.tracker.canvas.height = height;

    map.addSource('canvas-source', {
      type: 'canvas',
      canvas: this.tracker.canvas,
      coordinates: getSourceCoordinates(map),
      // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
      animate: true,
    });
    map.addLayer(
      {
        id: 'canvas-layer',
        type: 'raster',
        source: 'canvas-source',
        paint: {
          'raster-opacity': 1,
          'raster-fade-duration': 0,
        },
      },
      beforeLayerId,
    );
  }

  addTrackerFilters() {
    // Setting filters from the permalink.
    const parameters = qs.parse(window.location.search.toLowerCase());
    const lineParam = parameters[TrajservLayer.LINE_FILTER];
    const routeParam = parameters[TrajservLayer.ROUTE_FILTER];
    const opParam = parameters[TrajservLayer.OPERATOR_FILTER];
    const { regexPublishedLineName } = this.options;

    if (lineParam || routeParam || opParam || regexPublishedLineName) {
      this.filterFc = TrajservLayer.createFilter(
        lineParam ? lineParam.split(',') : undefined,
        routeParam ? routeParam.split(',') : undefined,
        opParam ? opParam.split(',') : undefined,
        regexPublishedLineName,
      );
    } else {
      this.filterFc = null;
    }

    this.setFilter(this.filterFc);
  }

  start() {
    if (!this.map) {
      return;
    }

    this.addTrackerFilters();

    super.start(this.map);
    this.startUpdateTrajectories();

    this.map.on('click', this.onMapClick);
    this.map.on('move', this.onMove);
    this.map.on('moveend', this.onMoveEnd);
  }

  stop() {
    this.journeyId = null;
    this.stopUpdateTrajectories();
    this.abortFetchTrajectories();
    if (this.map) {
      this.map.off('click', this.onClick);
      this.map.off('move', this.onMove);
      this.map.off('moveend', this.onMoveEnd);
    }
    super.stop();
  }

  /**
   * Callback on 'move' event.
   * @private
   */
  onMove() {
    this.map
      .getSource('canvas-source')
      .setCoordinates(getSourceCoordinates(this.map));
    const { width, height } = this.map.getCanvas();
    this.tracker.renderTrajectories(this.currTime, [width, height], 100);
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
   * @private
   */
  onMapClick(evt) {
    if (!this.clickCallbacks.length) {
      return;
    }

    const [vehicle] = this.getVehiclesAtCoordinate(
      fromLonLat([evt.lngLat.lng, evt.lngLat.lat]),
    );

    if (vehicle) {
      this.selectedVehicleId = vehicle.id;
      this.journeyId = vehicle.journeyIdentifier;
      this.updateTrajectoryStations(this.selectedVehicleId).then(
        (vehicleWithStations) => {
          this.clickCallbacks.forEach((callback) =>
            callback(vehicleWithStations, this, evt),
          );
        },
      );
    } else {
      this.selectedVehicleId = null;
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

  abortFetchTrajectories() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Fetch stations information with a trajectory ID
   * @param {number} trajId The ID of the trajectory
   * @private
   */
  updateTrajectoryStations(trajId) {
    const params = this.getParams({
      id: trajId,
      time: getUTCTimeString(new Date()),
    });
    return this.api.fetchTrajectoryStations(params).then((trajStations) => {
      this.stationsCoords = [];
      trajStations.stations.forEach((station) => {
        this.stationsCoords.push(fromLonLat(station.coordinates));
      });
      return trajStations;
    });
  }

  /**
   * Highlight the trajectory of journey.
   * @param {String} journeyId The id of the journey.
   */
  highlightTrajectory(journeyId) {
    this.api
      .fetchTrajectoryById({
        id: journeyId,
        time: getUTCTimeString(new Date()),
      })
      .then((traj) => {
        const { p: multiLine, t, c } = traj;
        const lineCoords = [];
        multiLine.forEach((line) => {
          line.forEach((point) => {
            lineCoords.push([point.x, point.y]);
          });
        });
        // this.drawFullTrajectory(
        //   this.stationsCoords,
        //   new LineString(lineCoords),
        //   c ? `#${c}` : getBgColor(t),
        // );
      })
      .catch(() => {
        this.map.removeLayer('highlight-trajectory');
      });
  }

  /**
   * Returns the URL Parameters
   * @param {Object} extraParams
   * @returns {Object}
   * @private
   */
  getParams(extraParams = {}) {
    const bounds = this.map.getBounds().toArray();
    const southWest = fromLonLat(bounds[0]);
    const northEast = fromLonLat(bounds[1]);
    const ext = [...southWest, ...northEast];
    const bbox = buffer(ext, getWidth(ext) / 10).join(',');
    const intervalMs = this.speed * 20000; // 20 seconds, arbitrary value, could be : (this.requestIntervalSeconds + 1) * 1000;
    const now = this.currTime;

    let diff = true;

    if (
      this.later &&
      now.getTime() > this.later.getTime() - 3000 * this.speed
    ) {
      diff = false;
    }
    if (
      !this.later ||
      !diff ||
      this.later.getTime() - now.getTime() > intervalMs
    ) {
      const later = new Date(now.getTime() + intervalMs);
      this.later = later;
    }

    const params = {
      ...extraParams,
      bbox,
      btime: getUTCTimeString(now),
      etime: getUTCTimeString(this.later),
      date: getDateString(now),
      rid: 1,
      a: 1,
      cd: 1,
      nm: 1,
      fl: 1,
      s: this.map.getZoom() < 10 ? 1 : 0,
      z: this.map.getZoom(),
      // toff: this.currTime.getTime() / 1000,
    };

    // Allow to load only differences between the last request,
    // but currently the Tracker render method doesn't manage to render only diff.
    /* if (diff) {
      // Not working
      params.diff = this.lastRequestTime;
    } */
    return params;
  }

  /**
   * Start the update of trajectories.
   * @private
   */
  startUpdateTrajectories() {
    this.stopUpdateTrajectories();

    this.updateTrajectories();
    this.updateInterval = window.setInterval(() => {
      this.updateTrajectories();
    }, this.requestIntervalSeconds * 1000);
  }

  /**
   * Stop the update of trajectories.
   * @private
   */
  stopUpdateTrajectories() {
    clearInterval(this.updateInterval);
  }

  /**
   * Update the trajectories
   * @private
   */
  updateTrajectories() {
    this.abortFetchTrajectories();
    this.abortController = new AbortController();
    this.api
      .fetchTrajectories(
        this.getParams({
          attr_det: 1,
        }),
        this.abortController,
      )
      .then((trajectories) => {
        this.tracker.setTrajectories(trajectories);
      });
  }

  /**
   * Define the style of the vehicle.
   *
   * @param {Object} props Properties
   * @private
   */
  style(props) {
    const { type, name, id, color, textColor, delay, cancelled } = props;
    const z = Math.min(Math.floor(this.currentZoom || 1), 16);
    const hover = this.tracker.hoverVehicleId === id;
    const selected = this.selectedVehicleId === id;
    const key = `${z}${type}${name}${delay}${hover}${selected}`;

    if (!this.styleCache[key]) {
      let radius = getRadius(type, z);

      if (hover || selected) {
        radius += 5;
      }
      const margin = 1;
      const radiusDelay = radius + 2;
      const origin = radiusDelay + margin;

      const canvas = document.createElement('canvas');
      canvas.width = radiusDelay * 2 + margin * 2 + 100;
      canvas.height = radiusDelay * 2 + margin * 2;
      const ctx = canvas.getContext('2d');

      if (delay !== null) {
        // Draw delay background
        ctx.save();
        ctx.beginPath();
        ctx.arc(origin, origin, radiusDelay, 0, 2 * Math.PI, false);
        ctx.fillStyle = getDelayColor(delay, cancelled);
        ctx.filter = 'blur(1px)';
        ctx.fill();
        ctx.restore();
      }

      // Show delay if feature is hovered or if delay is above 5mins.
      if (hover || delay >= this.delayDisplay) {
        // Draw delay text
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.max(
          14,
          Math.min(17, radius * 1.2),
        )}px arial, sans-serif`;
        ctx.fillStyle = getDelayColor(delay, cancelled);

        ctx.strokeStyle = this.delayOutlineColor;
        ctx.lineWidth = 1.5;
        ctx.strokeText(getDelayText(delay, cancelled), origin * 2, origin);
        ctx.fillText(getDelayText(delay, cancelled), origin * 2, origin);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
      if (!this.useDelayStyle) {
        ctx.fillStyle = color || getBgColor(type);
        ctx.fill();
      } else {
        ctx.fillStyle = getDelayColor(delay, cancelled);
        ctx.fill();
      }

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      const markerSize = radius * 2;
      if (radius > 10) {
        const shortname =
          type === 'Rail' && name.length > 3 ? name.substring(0, 2) : name;
        const fontSize = Math.max(radius, 10);
        const textSize = getTextSize(ctx, markerSize, shortname, fontSize);

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = !this.useDelayStyle
          ? textColor || getTextColor(type)
          : '#000000';
        ctx.font = `bold ${textSize}px Arial`;
        ctx.fillText(shortname, origin, origin);
      }
      this.styleCache[key] = canvas;
    }

    return this.styleCache[key];
  }
}

TrajservLayer.LINE_FILTER = 'publishedlinename';
TrajservLayer.ROUTE_FILTER = 'tripnumber';
TrajservLayer.OPERATOR_FILTER = 'operator';

export default TrajservLayer;
