/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import qs from 'query-string';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import { getDateString, getUTCTimeString } from '../timeUtils';
import {
  getRadius,
  getBgColor,
  getDelayColor,
  getDelayText,
  getTextColor,
  getTextSize,
} from '../trackerConfig';
import { TralisAPI, TralisModes } from '../../api';

/**
 * TralisLayerInterface.
 */
export class TralisLayerInterface {
  /*
   * Constructor

   * @param {Object} options Layer options.
   * @param {string} options.url Tralis service url.
   * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
   * @param {boolean} [options.debug=false] Display additional debug informations.
   * @param {TralisMode} [options.mode=TralisMode.TOPOGRAPHIC] - Mode.
   */
  constructor(options = {}) {}

  /**
   * Subscribe to the Tralis service.
   *
   * @param {ol/Map~Map} map
   */
  init(map) {}

  /**
   * Unsubscribe to the Tralis service.
   */
  terminate() {}

  /**
   * Change the mode.
   *
   * @param {TralisMode} mode  Tralis mode
   */
  setMode(mode) {}

  /**
   * Add a feature to the tracker.
   * @param {number} id The feature id
   * @param {Trajectory} traj Properties of the trajectory.
   * @param {boolean} [addOnTop=false] If true, the trajectory is added on top of
   *   the trajectory object. This affects the draw order. If addOnTop is
   *   true, the trajectory is drawn first and appears on bottom.
   * @private
   */
  addTrajectory(id, traj, addOnTop = false) {}

  /**
   * Remove a trajectory with a given id.
   * @param {number} id The trajectory id
   * @private
   */
  removeTrajectory(id) {}

  /**
   * Remove a trajectory by attribute.
   * @param {string} attributeName Name of the attribute.
   * @param {*} value Attribute value.
   * @private
   */
  removeTrajectoryByAttribute(attributeName, value) {}
}

/**
 * Mixin for TralisLayerInterface.
 *
 * @param {TrackerLayer} TrackerLayer A {TrackerLayer} class to extend with {TrajservLayerInterface} functionnalities.
 * @return {Class}  A class that implements {TralisLayerInterface} class and extends Base;
 * @private
 */
const TralisLayerMixin = (TrackerLayer) =>
  class extends TrackerLayer {
    constructor(options = {}) {
      super({ ...options });
      this.debug = options.debug;
      this.mode = options.mode || TralisModes.TOPOGRAPHIC;
      this.useDynamicIconScale = this.mode === TralisModes.SCHEMATIC;
      this.trajectories = [];
      this.refreshTimeInMs = 1000 / 30;
      this.onMessage = this.onMessage.bind(this);
      this.onDeleteMessage = this.onDeleteMessage.bind(this);
      this.api = options.api || new TralisAPI(options);
      this.format = new GeoJSON();

      // These scales depends from the size specifed in the svgs.
      // For some reason the size must be specified in the svg (../img/lines) for firefox.
      this.dfltIconScale = 0.6;
      this.dfltIconHighlightScale = 0.8;
      this.minIconScale = this.dfltIconScale * 0.75;
    }

    init(map) {
      super.init(map);
      this.api.subscribeTrajectory(this.mode, this.onMessage);
      this.api.subscribeDeletedVehicles(this.mode, this.onDeleteMessage);
    }

    terminate() {
      this.api.unsubscribeTrajectory();
      this.api.unsubscribeDeletedVehicles();
      super.terminate();
    }

    setMode(mode) {
      this.mode = mode;
      this.useDynamicIconScale = this.mode === TralisModes.SCHEMATIC;
      this.api.subscribeTrajectory(this.mode, this.onMessage);
      this.api.subscribeDeletedVehicles(this.mode, this.onDeleteMessage);
    }

    getIconScaleFromRes(res) {
      let scale = this.dfltIconScale;
      if (!this.useDynamicIconScale) {
        return scale;
      }
      if (res > this.resZoom11) {
        const dynamicScale = this.resZoom11 / res;
        scale =
          dynamicScale < this.minIconScale ? this.minIconScale : dynamicScale;
      } else if (res < this.resZoom112) {
        scale = this.resZoom12 / res;
      }
      return parseFloat(scale.toFixed(1));
    }

    onMessage(data) {
      if (!data.content) {
        return;
      }
      const feat = this.format.readFeature(data.content);

      feat.set('timeOffset', Date.now() - data.timestamp);

      // ignore old events [SBAHNM-97]
      if (feat.get('time_since_update') >= 0) {
        if (this.debug && this.mode === TralisModes.TOPOGRAPHIC) {
          const point = new Point(feat.get('raw_coordinates'));
          point.transform('EPSG:4326', this.map.getView().getProjection());
          feat.setGeometry(point);
        }

        this.addTrajectory(
          feat.get('train_id'),
          feat.getProperties(),
          !feat.get('line'),
        );
      }
    }

    onDeleteMessage(data) {
      if (data.content) {
        this.removeTrajectoryByAttribute('train_id', data.content);
      }
    }

    addTrajectory(id, traj, addOnTop) {
      const idx = this.trajectories.findIndex((t) => t.train_id === id);
      const { time_intervals: timeIntervals } = traj;

      // Properties needed to display the vehicle.
      const trajectory = { ...traj, id, timeIntervals };
      if (addOnTop) {
        this.trajectories.unshift(trajectory);
        if (idx !== -1) {
          this.tracker.trajectories.splice(idx + 1, 1);
        }
      } else {
        this.trajectories.push(trajectory);
        if (idx !== -1) {
          this.tracker.trajectories.splice(idx, 1);
        }
      }

      this.updateTrajectories();
    }

    removeTrajectory(id) {
      for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
        if (this.trajectories[i].id === id) {
          this.trajectories.splice(i, 1);
          break;
        }
      }
    }

    removeTrajectoryByAttribute(attributeName, value) {
      for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
        if (this.trajectories[i][attributeName] === value) {
          this.removeTrajectory(this.trajectories[i].id);
          break;
        }
      }
    }

    updateTrajectories() {
      this.tracker.setTrajectories(this.trajectories);
    }

    getRefreshTimeInMs() {
      return this.refreshTimeInMs;
    }
  };

export default TralisLayerMixin;
