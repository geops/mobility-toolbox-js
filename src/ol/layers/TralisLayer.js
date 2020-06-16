import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import TrackerLayer from './TrackerLayer';
import { TralisAPI, modes } from '../../api';
import getVehicleImage from '../../api/tralis/TralisStyle';

/**
 * Responsible for loading live data from Realtime service.
 * @class
 * @inheritDoc
 * @param {Object} options Layer options.
 * @param {string} options.url Realtime service url.
 * @param {string} options.apiKey Access key for [geOps services](https://developer.geops.io/).
 * @param {boolean} [options.debug=false] Display additional debug informations.
 * @param {TralisMode} [options.mode=TralisMode.TOPOGRAPHIC] Mode.
 */
class TralisLayer extends TrackerLayer {
  constructor(options = {}) {
    let opt = options;
    if (typeof opt === 'string') {
      opt = {
        url: options,
      };
    }
    super({ ...opt });
    this.url = opt.url;
    this.apiKey = opt.apiKey;
    if (this.url && opt.apiKey) {
      this.url = `${this.url}?key=${opt.apiKey}`;
    }
    this.debug = opt.debug;
    this.mode = opt.mode || modes.TOPOGRAPHIC;
    this.useDynamicIconScale = this.mode === modes.SCHEMATIC;
    this.trajectories = [];
    this.format = new GeoJSON();
    this.resZoom11 = null;
    this.resZoom12 = null;
    this.refreshTimeInMs = 100 / 60;
    this.onMessage = this.onMessage.bind(this);
    this.onDeleteMessage = this.onDeleteMessage.bind(this);
    this.api = new TralisAPI(this.url);
  }

  /**
   * Initialize the layer:
   *  - add layer to the OpenLayers Map.
   *  - add listeners to the OpenLayers Map.
   *  - subscribe to the Realtime service.
   * @param {ol/Map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html Map}   *
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    this.resZoom11 = map.getView().getResolutionForZoom(11); // res zoom 11
    this.resZoom12 = map.getView().getResolutionForZoom(12);

    // These scales depends from the size specifed in the svgs.
    // For some reason the size must be specified in the svg (../img/lines) for firefox.
    this.dfltIconScale = 0.6;
    this.dfltIconHighlightScale = 0.8;
    this.minIconScale = this.dfltIconScale * 0.75;
    this.iconScale = this.getIconScaleFromRes(map.getView().getResolution());

    this.olListenersKeys.push(
      map.getView().on('change:resolution', ({ target: view }) => {
        this.iconScale = this.getIconScaleFromRes(view.getResolution());
      }),
    );

    this.api.subscribeTrajectory(this.mode, this.onMessage);
    this.api.subscribeDeletedVehicles(this.mode, this.onDeleteMessage);
  }

  /**
   * Terminate the layer:
   *  - remove layer from the OpenLayers Map.
   *  - remove listeners from the OpenLayers Map.
   *  - unsubscribe to the Realtime service.
   * @param {ol/Map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html Map}   *
   */
  terminate(map) {
    this.api.unsubscribeTrajectory();
    this.api.unsubscribeDeletedVehicles();
    super.terminate(map);
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

  setMode(mode) {
    this.mode = mode;
    this.useDynamicIconScale = this.mode === modes.SCHEMATIC;
    this.api.subscribeTrajectory(this.mode, this.onMessage);
    this.api.subscribeDeletedVehicles(this.mode, this.onDeleteMessage);
  }

  style(props) {
    const { id, line, rotation } = props;
    const hover = this.hoverVehicleId === id;
    const selected = this.selectedVehicleId === id;
    const lineName = line && line.name;

    return getVehicleImage(
      lineName,
      rotation,
      this.iconScale *
        (hover || selected ? this.dfltIconHighlightScale : this.dfltIconScale),
    );
  }

  onMessage(data) {
    if (!data.content) {
      return;
    }
    const feat = this.format.readFeature(data.content);

    feat.set('timeOffset', Date.now() - data.timestamp);

    // ignore old events [SBAHNM-97]
    if (feat.get('time_since_update') >= 0) {
      if (this.debug && this.mode === modes.TOPOGRAPHIC) {
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

  /**
   * Add a feature to the tracker.
   * @param {Number} id The feature id
   * @param {Object} traj Properties of the trajectory.
   * @param {Boolean} addOnTop If true, the trajectory is added on top of
   *   the trajectory object. This affects the draw order. If addOnTop is
   *   true, the trajectory is drawn first and appears on bottom.
   * @private
   */
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

  /**
   * Remove a trajectory with a given id.
   * @param {Number} id The trajectory id
   * @private
   */
  removeTrajectory(id) {
    for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
      if (this.trajectories[i].id === id) {
        this.trajectories.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Remove a trajectory by attribute.
   * @param {string} attributeName Name of the attribute.
   * @param {*} value Attribute value.
   * @private
   */
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
}

export default TralisLayer;
