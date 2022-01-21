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
   * @param {TralisMode} [options.mode=TralisMode.TOPOGRAPHIC] Tralis's Mode.
   * @param {number} [options.minZoomNonTrain=9] Minimal zoom when non trains vehicles are allowed to be displayed.
   */
  constructor(options = {}) {}

  /**
   * Initialize the layer subscribing to the Tralis api.
   *
   * @param {ol/Map~Map} map
   */
  init(map) {}

  /**
   * Terminate the layer unsubscribing to the Tralis api.
   */
  terminate() {}

  /**
   * Set the Tralis api's bbox.
   */
  setBbox(bbox) {}

  /**
   * Set the Tralis api's mode.
   *
   * @param {TralisMode} mode  Tralis mode
   */
  setMode(mode) {}

  /**
   * Request the stopSequence and the fullTrajectory informations for a vehicle.
   *
   * @param {string} id The vehicle identifier (the  train_id property).
   * @param {TralisMode} mode The mode to request. If not defined, the layer´s mode propetrty will be used.
   * @return {Promise<{stopSequence: StopSequence, fullTrajectory: FullTrajectory>} A promise that will be resolved with the trajectory informations.
   */
  getTrajectoryInfos(vehicleId, mode) {}

  /**
   * Define the style of the vehicle.
   * Draw a blue circle with the id of the props parameter.
   *
   * @param {TralisTrajectory} trajectory  A trajectory
   * @param {ViewState} viewState Map's view state (zoom, resolution, center, ...)
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
      this.api = options.api || new TralisAPI(options);
      this.tenant = options.tenant || ''; // sbb,sbh or sbm
      this.minZoomNonTrain = options.minZoomNonTrain || 9; // Min zoom level from which non trains are allowed to be displayed. Min value is 9 (as configured by the server
      this.format = new GeoJSON();

      // This property will call api.setBbox on each movend event
      this.isUpdateBboxOnMoveEnd = options.isUpdateBboxOnMoveEnd || true;

      // Bind callbacks
      this.onTrajectoryMessage = this.onTrajectoryMessage.bind(this);
      this.onDeleteTrajectoryMessage = this.onDeleteTrajectoryMessage.bind(
        this,
      );
    }

    start() {
      super.start();
      this.api.open();
      this.api.subscribeTrajectory(this.mode, this.onTrajectoryMessage);
      this.api.subscribeDeletedVehicles(
        this.mode,
        this.onDeleteTrajectoryMessage,
      );
      this.setBbox();
    }

    stop() {
      super.stop();
      this.api.close();
      this.api.unsubscribeTrajectory(this.onTrajectoryMessage);
      this.api.unsubscribeDeletedVehicles(this.onDeleteTrajectoryMessage);
    }

    setBbox(bbox) {
      if (this.isUpdateBboxOnMoveEnd) {
        // Clean trajectories before sending the new bbox
        this.api.bbox = bbox;
      }
    }

    setMode(mode) {
      if (this.mode === mode) {
        return;
      }
      this.mode = mode;
      this.api.subscribeTrajectory(this.mode, this.onTrajectoryMessage);
      this.api.subscribeDeletedVehicles(
        this.mode,
        this.onDeleteTrajectoryMessage,
      );
    }

    /**
     * Request the stopSequence and the fullTrajectory informations for a vehicle.
     *
     * @param {string} id The vehicle identifier (the  train_id property).
     * @param {TralisMode} mode The mode to request. If not defined, the layer´s mode propetrty will be used.
     * @return {Promise<{stopSequence: StopSequence, fullTrajectory: FullTrajectory>} A promise that will be resolved with the trajectory informations.
     */
    getTrajectoryInfos(vehicleId, mode) {
      // When a vehicle is selected, we request the complete stop sequence and the complete full trajectory.
      // Then we combine them in one response and send them to inherited layers.
      const promises = [
        this.api.getStopSequence(vehicleId, mode || this.mode),
        this.api.getFullTrajectory(vehicleId, mode || this.mode),
      ];

      return Promise.all(promises).then(([stopSequence, fullTrajectory]) => {
        const response = {
          stopSequence,
          fullTrajectory,
        };
        return response;
      });
    }

    /**
     * Determine if the trajectory must be rendered or not.
     * By default, this function exclude vehicles:
     *  - that have their trajectory outside the current extent and
     *  - that are not a train and zoom level is lower than layer's minZoomNonTrain property.
     *
     * @param {TralisTrajectory} trajectory
     * @param {Array<number>} extent
     * @param {number} zoom
     * @return {boolean} if the trajectory must be displayed or not.
     * @ignore
     */
    mustNotBeDisplayed(trajectory, extent, zoom) {
      return (
        !intersects(extent, trajectory.bounds) ||
        (trajectory.type !== 'rail' && zoom < (this.minZoomNonTrain || 9))
      );
    }

    /**
     * Add a trajectory to the tracker.
     * @param {TralisTrajectory} trajectory The trajectory to add.
     * @param {boolean} [addOnTop=false] If true, the trajectory is added on top of
     *   the trajectory object. This affects the draw order. If addOnTop is
     *   true, the trajectory is drawn first and appears on bottom.
     * @private
     */
    addTrajectory(traj, addOnTop) {
      const idx = this.trajectories.findIndex(
        (t) => t.train_id === traj.train_id,
      );
      const { time_intervals: timeIntervals } = traj;

      // Properties needed to display the vehicle.
      const trajectory = { ...traj, id: traj.train_id, timeIntervals };
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

    /**
     * Remove a trajectory using its id.
     * @param {number} id The trajectory's train_id property of the trajectory to remove
     * @private
     */
    removeTrajectory(id) {
      for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
        if (this.trajectories[i].train_id === id) {
          this.trajectories.splice(i, 1);
          break;
        }
      }
    }

    /**
     * Callback on websocket's trajectory channel events.
     * It adds a trajectory to the list.
     *
     * @private
     */
    onTrajectoryMessage(data) {
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
          this.addTrajectory(feat.getProperties(), !feat.get('line'));
        }
      }
    }

    /**
     * Callback on websocket's deleted_vehicles channel events.
     * It removes the trajectory from the list.
     *
     * @private
     * @override
     */
    onDeleteTrajectoryMessage(data) {
      if (data.content) {
        this.removeTrajectory(data.content);
      }
    }

    /**
     * Callback when user moves the mouse/pointer over the map.
     * It sets the layer's hoverVehicleId property with the current hovered vehicle's id.
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
     * Callback when user clicks on the map.
     * It sets the layer's selectedVehicleId property with the current selected vehicle's id.
     *
     * @private
     * @override
     */
    onFeatureClick(features, layer, coordinate) {
      const [feature] = features;
      let id = null;
      if (feature) {
        id = feature.get('train_id');
      }
      if (this.selectedVehicleId !== id) {
        /** @ignore */
        this.selectedVehicleId = id;
        this.renderTrajectories();
      }
      super.onFeatureClick(features, layer, coordinate);
    }
  };

export default TralisLayerMixin;
