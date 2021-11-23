/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import qs from 'query-string';
import { unByKey } from 'ol/Observable';
import { getUTCDateString, getUTCTimeString } from '../timeUtils';
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
   * Draw a circle depending on trajectory data.
   *
   * @param {TrajservTrajectory} trajectory  A trajectory
   * @param {ViewState} viewState Map's view state (zoom, resolution, center, ...)
   * @private
   */
  defaultStyle(trajectory, viewState) {}
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
      } = options;

      let requestIntervalSeconds = 3;
      let defaultApi;
      if (!options.api) {
        const apiOptions = {};
        if (options.url) {
          apiOptions.url = options.url;
        }
        if (options.apiKey) {
          apiOptions.apiKey = options.apiKey;
        }
        defaultApi = new TrajservAPI(apiOptions);
      }
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
          get: () => {
            return requestIntervalSeconds;
          },
          set: (newRequestIntervalSeconds) => {
            if (newRequestIntervalSeconds !== requestIntervalSeconds) {
              requestIntervalSeconds = newRequestIntervalSeconds;
              if (this.visible) {
                // stop() is call within the start.
                this.start();
              }
            }
          },
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
          value: options.api || defaultApi,
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

    /**
     * Apply the highlight style on hover.
     *
     * @private
     * @override
     */
    onFeatureHover(featureInfo) {
      const {
        features: [feature],
      } = featureInfo;
      let id = null;
      if (feature) {
        id = feature.get('id');
      }
      if (this.hoverVehicleId !== id) {
        /** @ignore */
        this.hoverVehicleId = id;
        this.renderTrajectories();
      }
      super.onFeatureHover(featureInfo);
    }

    /**
     * Display the complete trajectory of the vehicle.
     *
     * @private
     * @override
     */
    onFeatureClick(features, layer, coordinate) {
      const [feature] = features;
      if (feature) {
        console.log(feature);
        /** @ignore */
        this.selectedVehicleId = feature.get('id');
        /** @ignore */
        this.journeyId = feature.get('journeyIdentifier');
        this.updateTrajectoryStations(this.selectedVehicleId);
      } else {
        this.selectedVehicleId = null;
      }
      super.onFeatureClick(features, layer, coordinate);
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
      // The 5 seconds more are used as a buffer if the request takes too long.
      const requestIntervalInMs = (this.requestIntervalSeconds + 5) * 1000;
      const intervalMs = this.speed * requestIntervalInMs;
      const now = this.time;

      let diff = true;

      if (
        this.later &&
        now.getTime() >
          this.later.getTime() - this.requestIntervalSeconds * 1000
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
        date: getUTCDateString(now),
        rid: 1,
        a: 1,
        cd: 1,
        nm: 1,
        fl: 1,
        // toff: this.time.getTime() / 1000,
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
        .catch((err) => {
          if (err.name === 'AbortError') {
            // Ignore abort error
            return;
          }
          throw err;
        })
        .then((trajectories) => {
          // Don't set trajectories when the user has aborted the request.
          if (trajectories) {
            this.tracker.setTrajectories(trajectories);
            this.renderTrajectories();
          }
        });
    }

    /**
     * Define the style of the vehicle.
     *
     * @param {TrajservTrajectory} trajectory  A trajectory
     * @param {ViewState} viewState Map's view state (zoom, resolution, center, ...)
     */
    defaultStyle(trajectory, viewState) {
      const { zoom } = viewState;
      const {
        type,
        name,
        id,
        color,
        textColor,
        delay,
        cancelled,
        operatorProvidesRealtime,
      } = trajectory;
      const z = Math.min(Math.floor(zoom || 1), 16);
      const hover = this.hoverVehicleId === id;
      const selected = this.selectedVehicleId === id;
      let key = `${z}${type}${name}${operatorProvidesRealtime}${delay}${hover}${selected}${cancelled}`;

      // Calcul the radius of the circle
      let radius = getRadius(type, z) * this.pixelRatio;
      const isDisplayStrokeAndDelay = radius >= 7 * this.pixelRatio;
      if (hover || selected) {
        radius = isDisplayStrokeAndDelay
          ? radius + 5 * this.pixelRatio
          : 14 * this.pixelRatio;
      }
      const mustDrawText = radius > 10 * this.pixelRatio;

      // Optimize the cache key, very important in high zoom level
      if (!mustDrawText) {
        key = `${z}${type}${color}${operatorProvidesRealtime}${delay}${hover}${selected}${cancelled}`;
      }

      if (!this.styleCache[key]) {
        if (radius === 0) {
          this.styleCache[key] = null;
          return null;
        }

        const margin = 1 * this.pixelRatio;
        const radiusDelay = radius + 2;
        const markerSize = radius * 2;

        const canvas = document.createElement('canvas');
        // add space for delay information
        canvas.width = radiusDelay * 2 + margin * 2 + 100 * this.pixelRatio;
        canvas.height = radiusDelay * 2 + margin * 2 + 100 * this.pixelRatio;
        const ctx = canvas.getContext('2d');
        const origin = canvas.width / 2;

        if (isDisplayStrokeAndDelay && delay !== null) {
          // Draw circle delay background
          ctx.save();
          ctx.beginPath();
          ctx.arc(origin, origin, radiusDelay, 0, 2 * Math.PI, false);
          ctx.fillStyle = getDelayColor(delay, cancelled);
          ctx.filter = 'blur(1px)';
          ctx.fill();
          ctx.restore();
        }

        // Show delay if feature is hovered or if delay is above 5mins.
        if (
          isDisplayStrokeAndDelay &&
          (hover || delay >= this.delayDisplay || cancelled)
        ) {
          // Draw delay text
          ctx.save();
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${Math.max(
            cancelled ? 19 : 14,
            Math.min(cancelled ? 19 : 17, radius * 1.2),
          )}px arial, sans-serif`;
          ctx.fillStyle = getDelayColor(delay, cancelled, true);

          ctx.strokeStyle = this.delayOutlineColor;
          ctx.lineWidth = 1.5 * this.pixelRatio;
          const delayText = getDelayText(delay, cancelled);
          ctx.strokeText(delayText, origin + radiusDelay + margin, origin);
          ctx.fillText(delayText, origin + radiusDelay + margin, origin);
          ctx.restore();
        }

        // Draw colored circle with black border
        let circleFillColor;
        if (this.useDelayStyle) {
          circleFillColor = getDelayColor(delay, cancelled);
        } else {
          circleFillColor = color || getBgColor(type);
        }

        ctx.save();
        if (isDisplayStrokeAndDelay || hover || selected) {
          ctx.lineWidth = 1 * this.pixelRatio;
          ctx.strokeStyle = '#000000';
        }
        ctx.fillStyle = circleFillColor;
        ctx.beginPath();
        ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        // Dashed outline if a provider provides realtime but we don't use it.
        if (
          isDisplayStrokeAndDelay &&
          this.useDelayStyle &&
          delay === null &&
          operatorProvidesRealtime === 'yes'
        ) {
          ctx.setLineDash([5, 3]);
        }
        if (isDisplayStrokeAndDelay || hover || selected) {
          ctx.stroke();
        }
        ctx.restore();

        // Draw text in the circle
        if (mustDrawText) {
          const fontSize = Math.max(radius, 10 * this.pixelRatio);
          const textSize = getTextSize(ctx, markerSize, name, fontSize);

          // Draw a stroke to the text only if a provider provides realtime but we don't use it.
          if (
            this.useDelayStyle &&
            delay === null &&
            operatorProvidesRealtime === 'yes'
          ) {
            ctx.save();
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.font = `bold ${textSize + 2}px Arial`;
            ctx.strokeStyle = circleFillColor;
            ctx.strokeText(name, origin, origin);
            ctx.restore();
          }

          // Draw a text
          ctx.save();
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          ctx.fillStyle = !this.useDelayStyle
            ? textColor || getTextColor(type)
            : '#000000';
          ctx.font = `bold ${textSize}px Arial`;
          ctx.strokeStyle = circleFillColor;
          ctx.strokeText(name, origin, origin);
          ctx.fillText(name, origin, origin);
          ctx.restore();
        }

        this.styleCache[key] = canvas;
      }

      return this.styleCache[key];
    }
  };

export default TrajservLayerMixin;
