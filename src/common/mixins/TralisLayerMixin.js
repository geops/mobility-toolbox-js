/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import { intersects } from 'ol/extent';
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
   * @param {TralisTrajectory} traj Properties of the trajectory.
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

  /**
   * Define the style of the vehicle.
   * Draw a blue circle with the id of the props parameter.
   *
   * @param {TralisTrajectory} trajectory  A trajectory
   * @param {ViewState} viewState Map's view state (zoom, resolution, center, ...)
   * @private
   */
  defaultStyle(trajectory, viewState) {}
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
      this.onMessage = this.onMessage.bind(this);
      this.onDeleteMessage = this.onDeleteMessage.bind(this);
      this.api = options.api || new TralisAPI(options);
      this.tenant = options.tenant || ''; // sbb,sbh or sbm
      this.minZoomNonTrain = options.minZoomNonTrain || 9; // Min zoom level from which non trains are allowed to be displayed. Min value is 9 (as configured by the server
      this.format = new GeoJSON();

      // This property will call api.setBbox on each movend event
      this.isUpdateBboxOnMoveEnd = options.isUpdateBboxOnMoveEnd || true;
    }

    start() {
      super.start();
      this.api.subscribeTrajectory(this.mode, this.onMessage);
      this.api.subscribeDeletedVehicles(this.mode, this.onDeleteMessage);
      this.setBbox();
    }

    stop() {
      super.stop();
      this.api.unsubscribeTrajectory(this.onMessage);
      this.api.unsubscribeDeletedVehicles(this.onDeleteMessage);
    }

    /**
     * Send the bbox to the websocket. The child classe must send the bbox parameter.
     */
    setBbox(bbox) {
      if (this.isUpdateBboxOnMoveEnd) {
        // Clean trajectories before sending the new bbox
        this.api.setBbox(bbox);
      }
    }

    setMode(mode) {
      if (this.mode === mode) {
        return;
      }
      this.mode = mode;
      this.api.subscribeTrajectory(this.mode, this.onMessage);
      this.api.subscribeDeletedVehicles(this.mode, this.onDeleteMessage);
    }

    /**
     * Determine if the trajectory must be removed or not added to the list
     *
     * @param {*} trajectory
     * @param {*} extent
     * @param {*} zoom
     * @returns
     * @ignore
     */
    mustNotBeDisplayed(trajectory, extent, zoom) {
      return (
        !intersects(extent, trajectory.bounds) ||
        (trajectory.type !== 'rail' && zoom < (this.minZoomNonTrain || 9))
      );
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
        id = feature.get('train_id');
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
        this.selectedVehicleId = feature.get('train_id');
        this.highlightTrajectory();
      } else {
        this.selectedVehicleId = null;
      }
      super.onFeatureClick(features, layer, coordinate);
    }

    onMessage(data) {
      if (!data.content) {
        return;
      }

      const feat = this.format.readFeature(data.content);

      feat.set('timeOffset', Date.now() - data.timestamp);

      // ignore old events [SBAHNM-97]
      if (feat.get('time_since_update') >= 0) {
        if (
          this.debug &&
          this.mode === TralisModes.TOPOGRAPHIC &&
          feat.get('raw_coordinates')
        ) {
          const point = new Point(feat.get('raw_coordinates'));
          point.transform('EPSG:4326', this.map.getView().getProjection());
          feat.setGeometry(point);
        }
        if (!this.mustNotBeDisplayed(feat.getProperties())) {
          this.addTrajectory(
            feat.get('train_id'),
            feat.getProperties(),
            !feat.get('line'),
          );
        }
      }
    }

    onDeleteMessage(data) {
      if (data.content) {
        this.removeTrajectoryByAttribute('train_id', data.content);
      }
    }

    /**
     * When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
     * Then we combine them in one response and send them to inherited layers.
     *
     * @private
     * @override
     */
    highlightTrajectory() {
      // When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
      // Then we combine them in one response and send them to inherited layers.
      const promises = [
        this.api.getStopSequence(this.selectedVehicleId, this.mode),
        this.api.getFullTrajectory(this.selectedVehicleId, this.mode),
      ];

      return Promise.all(promises).then(([stopSequence, fullTrajectory]) => {
        const response = {
          stopSequence,
          fullTrajectory,
        };
        return response;
      });
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

      this.tracker.setTrajectories(this.trajectories);
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
  };

export default TralisLayerMixin;
