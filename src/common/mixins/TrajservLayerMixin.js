/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import qs from 'query-string';
import { getDateString, getUTCTimeString } from '../timeUtils';
import {
  getRadius,
  getBgColor,
  getDelayColor,
  getDelayText,
  getTextColor,
  getTextSize,
} from '../trackerConfig';
import { TrajservAPI } from '../../api';

/**
 * TrajservLayerInterface.
 *
 * @classproperty {boolean} isTrackerLayer - Property for duck typing since `instanceof` is not working when the instance was created on different bundles.
 * @classproperty {boolean} isHoverActive - Activate/deactivate pointer hover effect.
 * @classproperty {function} style - Style of the vehicle.
 * @classproperty {FilterFunction} filter - Time speed.
 * @classproperty {function} sort - Set the filter for tracker features.
 *
 * @extends {TrackerLayerInterface}
 */
export class TrajservLayerInterface {
  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map|mapboxgl.Map} map A map.
   * @override
   */
  init(map) {}

  /**
   * Start to update trajectories and initialize the filter.
   * @override
   */
  start() {}

  /**
   * Stop to update trajectories.
   * @override
   */
  stop() {}

  /**
   * Set the tracker filter property using class properties.
   * @private
   */
  addTrackerFilters() {}

  /**
   * Abort http requests.
   *
   * @private
   */
  abortFetchTrajectories() {}

  /**
   * Fetch stations information with a trajectory id.
   * @param {number} trajId The id of the trajectory.
   * @private
   */
  updateTrajectoryStations(trajId) {}

  /**
   * Returns the URL parameters.
   * @param {Object} extraParams Extra parameters
   * @returns {Object}
   * @private
   */
  getParams(extraParams = {}) {}

  /**
   * Start the update of trajectories.
   * @private
   */
  startUpdateTrajectories() {}

  /**
   * Stop the update of trajectories.
   * @private
   */
  stopUpdateTrajectories() {}

  /**
   * Update the trajectories
   * @private
   */
  updateTrajectories() {}

  /**
   * Define the style of the vehicle.
   * Draw a colored circle depending on train delay.
   *
   * @param {Object} props Properties
   * @private
   */
  defaultStyle(props) {}
}

const LINE_FILTER = 'publishedlinename';
const ROUTE_FILTER = 'tripnumber';
const OPERATOR_FILTER = 'operator';

/**
 * Create a array of filter functions based on some parameters.
 * @param {string} line
 * @param {string} route
 * @param {string} operator
 * @param {string} regexLine
 * @private
 */
const createFilters = (line, route, operator, regexLine) => {
  const filterList = [];

  if (!line && !route && !operator && !regexLine) {
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

  if (route) {
    const routes = typeof route === 'string' ? route.split(',') : route;
    const routeList = routes.map((item) => parseInt(item, 10));
    const routeFilter = (item) => {
      const routeId = parseInt(item.routeIdentifier.split('.')[0], 10);
      return routeList.some((id) => id === routeId);
    };
    filterList.push(routeFilter);
  }

  if (operator) {
    const operatorList = typeof operator === 'string' ? [operator] : operator;
    const operatorFilter = (t) =>
      operatorList.some((op) => new RegExp(op, 'i').test(t.operator));
    filterList.push(operatorFilter);
  }

  if (!filterList.length) {
    return null;
  }

  return (t) => {
    for (let i = 0; i < filterList.length; i += 1) {
      if (!filterList[i](t)) {
        return false;
      }
    }
    return true;
  };
};

/**
 * Mixin for TrajservLayerInterface.
 *
 * @param {TrackerLayer} TrackerLayer A {TrackerLayer} class to extend with {TrajservLayerInterface} functionnalities.
 * @return {Class}  A class that implements {TrajservLayerInterface} class and extends Base;
 * @private
 */
const TrajservLayerMixin = (TrackerLayer) =>
  class extends TrackerLayer {
    /**
     * Define layer's properties.
     *
     * @ignore
     */
    defineProperties(options) {
      super.defineProperties(options);
      let {
        regexPublishedLineName,
        publishedLineName,
        tripNumber,
        operator,
        apiKey,
        apiKeyName,
      } = options;
      Object.defineProperties(this, {
        showVehicleTraj: {
          value:
            options.showVehicleTraj !== undefined
              ? options.showVehicleTraj
              : true,
          writable: true,
        },
        delayDisplay: {
          value: options.delayDisplay || 300000,
          writable: true,
        },
        delayOutlineColor: {
          value: options.delayOutlineColor || '#000000',
          writable: true,
        },
        useDelayStyle: {
          value: options.useDelayStyle || false,
          writable: true,
        },
        requestIntervalSeconds: {
          value: 3,
          writable: true,
        },
        publishedLineName: {
          get: () => {
            return publishedLineName;
          },
          set: (newPublishedLineName) => {
            publishedLineName = newPublishedLineName;
            this.updateFilters();
          },
        },
        tripNumber: {
          get: () => {
            return tripNumber;
          },
          set: (newTripNumber) => {
            tripNumber = newTripNumber;
            this.updateFilters();
          },
        },
        operator: {
          get: () => {
            return operator;
          },
          set: (newOperator) => {
            operator = newOperator;
            this.updateFilters();
          },
        },
        regexPublishedLineName: {
          get: () => {
            return regexPublishedLineName;
          },
          set: (newRegex) => {
            regexPublishedLineName = newRegex;
            this.updateFilters();
          },
        },
        api: {
          value:
            options.api ||
            new TrajservAPI({
              url: options.url,
              apiKey: options.apiKey,
              apiKeyName: options.apiKeyName,
            }),
        },
        apiKey: {
          get: () => {
            return apiKey;
          },
          set: (newApiKey) => {
            apiKey = newApiKey;
            if (this.api) {
              this.api.apiKey = apiKey;
            }
          },
        },
        apiKeyName: {
          get: () => {
            return apiKeyName;
          },
          set: (newApiKeyName) => {
            apiKeyName = newApiKeyName;
            if (this.api) {
              this.api.apiKeyName = apiKeyName;
            }
          },
        },
      });
    }

    init(map) {
      super.init(map);

      // Sort the trajectories.
      if (this.sortFc) {
        this.sort = this.sortFc;
      } else if (this.useDelayStyle) {
        // Automatic sorting depending on delay, higher delay on top.
        this.sort = (a, b) => {
          if (a.delay === null) return 1;
          return a.delay < b.delay ? 1 : -1;
        };
      }
    }

    start() {
      this.updateFilters();
      super.start();
      this.startUpdateTrajectories();
    }

    stop() {
      this.journeyId = null;
      this.stopUpdateTrajectories();
      this.abortFetchTrajectories();
      super.stop();
    }

    updateFilters() {
      // Setting filters from the permalink if no values defined by the layer.
      const parameters = qs.parse(window.location.search.toLowerCase());
      // filter is the property in TrackerLayerMixin.
      this.filter = createFilters(
        this.publishedLineName || parameters[LINE_FILTER],
        this.tripNumber || parameters[ROUTE_FILTER],
        this.operator || parameters[OPERATOR_FILTER],
        this.regexPublishedLineName,
      );
    }

    abortFetchTrajectories() {
      if (this.abortController) {
        this.abortController.abort();
      }
    }

    updateTrajectoryStations(trajId) {
      const params = this.getParams({
        id: trajId,
        time: getUTCTimeString(new Date()),
      });
      return this.api.fetchTrajectoryStations(params);
    }

    getParams(extraParams = {}) {
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
        btime: getUTCTimeString(now),
        etime: getUTCTimeString(this.later),
        date: getDateString(now),
        rid: 1,
        a: 1,
        cd: 1,
        nm: 1,
        fl: 1,
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

    startUpdateTrajectories() {
      this.stopUpdateTrajectories();

      this.updateTrajectories();
      this.updateInterval = window.setInterval(() => {
        this.updateTrajectories();
      }, this.requestIntervalSeconds * 1000);
    }

    stopUpdateTrajectories() {
      clearInterval(this.updateInterval);
    }

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
          // Don't set trajectories when the user has aborted the request.
          if (trajectories) {
            this.tracker.setTrajectories(trajectories);
          }
        });
    }

    defaultStyle(props, zoom) {
      const { type, name, id, color, textColor, delay, cancelled } = props;
      const z = Math.min(Math.floor(zoom || 1), 16);
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
          const fontSize = Math.max(radius, 10);
          const textSize = getTextSize(ctx, markerSize, name, fontSize);

          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          ctx.fillStyle = !this.useDelayStyle
            ? textColor || getTextColor(type)
            : '#000000';
          ctx.font = `bold ${textSize}px Arial`;
          ctx.fillText(name, origin, origin);
        }
        this.styleCache[key] = canvas;
      }

      return this.styleCache[key];
    }
  };

export default TrajservLayerMixin;
