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
    onFeatureHover(features, layer, coordinate) {
      const [feature] = features;
      let id = null;
      if (feature) {
        id = feature.get('id');
      }
      if (this.hoverVehicleId !== id) {
        /** @ignore */
        this.hoverVehicleId = id;
        this.renderTrajectories();
      }
      super.onFeatureHover(features, layer, coordinate);
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
        /** @ignore */
        this.selectedVehicleId = feature.get('id');
        /** @ignore */
        this.journeyId = feature.get('journeyIdentifier');
        this.highlightTrajectory();
      } else {
        this.selectedVehicleId = null;
        this.journeyId = null;
      }
      super.onFeatureClick(features, layer, coordinate);
    }

    /**
     * Highlight the trajectory of journey.
     * @private
     */
    highlightTrajectory() {
      const { selectedVehicleId, journeyId } = this;
      const promises = [
        // Fetch stations information with a trajectory id.
        this.api.fetchTrajectoryStations(
          this.getParams({
            id: selectedVehicleId,
            time: getUTCTimeString(new Date()),
          }),
        ),
        // Full trajectory.
        this.api.fetchTrajectoryById(
          this.getParams({
            id: journeyId,
            time: getUTCTimeString(new Date()),
          }),
        ),
      ];

      Promise.all(promises)
        .then(([trajStations, fullTraj]) => {
          const stationsCoords = [];
          if (trajStations) {
            trajStations.stations.forEach((station) => {
              stationsCoords.push(station.coordinates);
            });
          }

          if (fullTraj) {
            const { p: multiLine, t, c: color } = fullTraj;
            const lineCoords = [];
            multiLine.forEach((line) => {
              line.forEach((point) => {
                lineCoords.push([point.x, point.y]);
              });
            });

            const lineColor = color ? `#${color}` : getBgColor(t);
            // Don't allow white lines, use red instead.
            const vehiculeColor = /#ffffff/i.test(lineColor)
              ? '#ff0000'
              : lineColor;

            this.drawFullTrajectory(
              stationsCoords,
              lineCoords,
              this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
            );
          }
        })
        .catch(() => {
          this.drawFullTrajectory();
        });
    }

    abortFetchTrajectories() {
      if (this.abortController) {
        this.abortController.abort();
      }
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
     * Draw the trajectory as a line with points for each stop.
     *
     * @param {Array} stationsCoords Array of station coordinates in EPSG:4326.
     * @param {Array<ol/coordinate~Coordinate>} lineCoords A list of coordinates in EPSG:3857.
     * @param {string} color The color of the line.
     * @private
     */
    drawFullTrajectory(stationsCoords, lineCoords, color) {}

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
