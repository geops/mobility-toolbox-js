import GeoJSON from 'ol/format/GeoJSON';
import WebSocketConnector from './WebSocketConnector';
import { getModeSuffix, cleanStopTime, compareDepartures } from './utils';

/**
 * Enum for Tralis modes.
 * @readonly
 * @typedef {string} TralisMode
 * @property {string} RAW "raw"
 * @property {string} SCHEMATIC "schematic"
 * @property {string} TOPOGRAPHIC "topographic"
 * @enum {TralisMode}
 */
export const modes = {
  RAW: 'raw',
  TOPOGRAPHIC: 'topographic',
  SCHEMATIC: 'schematic',
};

/**
 * Access to Realtime api.
 * @class
 */
class TralisAPI {
  constructor(url) {
    this.dfltProjection = 'epsg:3857';
    this.conn = new WebSocketConnector(url);
    this.conn.setProjection(this.dfltProjection);
    this.subscribedStationUic = null;
    this.departureUpdateTimeout = null;
    this.maxDepartureAge = 30;
    this.extraGeoms = {};
    this.format = new GeoJSON();
  }

  /**
   * Subscribe to a channel.
   */
  subscribe(channel, onSuccess, onError, quiet) {
    this.conn.subscribe({ channel }, onSuccess, onError, quiet);
  }

  /**
   * Unsubscribe to a channel.
   */
  unsubscribe(channel, suffix = '') {
    this.conn.unsubscribe(
      `${channel}${getModeSuffix(modes.SCHEMATIC, modes)}${suffix}`,
    );
    this.conn.unsubscribe(
      `${channel}${getModeSuffix(modes.TOPOGRAPHIC, modes)}${suffix}`,
    );
  }

  /**
   * Filter departures and return an array.
   */
  filterDepartures(depObject, sortByMinArrivalTime) {
    const departures = Object.keys(depObject).map((k) => depObject[k]);
    departures.sort((a, b) => compareDepartures(a, b, sortByMinArrivalTime));

    let future = new Date();
    future.setMinutes(future.getMinutes() + this.maxDepartureAge);
    future = future.getTime();

    let past = new Date();
    past.setMinutes(past.getMinutes() - this.maxDepartureAge);
    past = past.getTime();

    const departureArray = [];
    const platformsBoarding = [];
    let previousDeparture = null;

    for (let i = departures.length - 1; i >= 0; i -= 1) {
      const d = departures[i];
      const t = new Date(d.time).getTime();

      // Only show departures within the next 30 minutes
      if (t > past && t < future) {
        // If 2 trains are boarding at the same platform,
        // remove the older one.
        if (d.state === 'BOARDING') {
          if (platformsBoarding.indexOf(d.platform) === -1) {
            platformsBoarding.push(d.platform);
          } else {
            d.state = 'HIDDEN';
          }
        }

        // If two trains with the same line number and destinatin
        // and a departure difference < 1 minute, hide the second one.
        if (
          previousDeparture &&
          d.to[0] === previousDeparture.to[0] &&
          Math.abs(t - previousDeparture.time) < 1000 &&
          d.line.name === previousDeparture.line.name
        ) {
          d.state = 'HIDDEN';
        }

        if (/(STOP_CANCELLED|JOURNEY_CANCELLED)/.test(d.state)) {
          d.cancelled = true;
        }

        previousDeparture = d;
        previousDeparture.time = t;
        departureArray.unshift(d);
      }
    }

    return departureArray;
  }

  /**
   * Subscribe to departures channel of a given station.
   * @param {Number} stationId UIC of the station..
   * @param {Boolean} sortByMinArrivalTime Sort by minimum arrival time
   *   [SBAHNM-316]
   */
  subscribeDepartures(stationId, sortByMinArrivalTime = false, callback) {
    window.clearTimeout(this.departureUpdateTimeout);
    this.unsubscribeDepartures();
    this.subscribedStationUic = stationId;
    const channel = stationId ? `timetable_${stationId}` : null;
    const departureObject = {};
    this.subscribe(
      channel,
      (data) => {
        if (data.source === channel) {
          const content = data.content || {};
          const tDiff = new Date(content.timestamp).getTime() - Date.now();
          content.timediff = tDiff;
          departureObject[content.call_id] = content;

          window.clearTimeout(this.departureUpdateTimeout);
          this.departureUpdateTimeout = window.setTimeout(() => {
            const departures = this.filterDepartures(
              departureObject,
              sortByMinArrivalTime,
            );
            callback(departures);
          }, 100);
        }
      },
      () => {
        callback([]);
      },
    );
  }

  /**
   * Unsubscribe from current departures channel.
   */
  unsubscribeDepartures() {
    if (this.subscribedStationUic) {
      this.unsubscribe(`timetable_${this.subscribedStationUic}`);
      this.subscribedStationUic = null;
    }
  }

  /**
   * Subscribe to the disruptions channel.
   */
  subscribeDisruptions(callback) {
    this.subscribe('newsticker', (data) => {
      callback(data.content);
    });
  }

  /**
   * Unsubscribe disruptions.
   */
  unsubscribeDisruptions() {
    this.unsubscribe('newsticker');
  }

  /**
   * Return a station with a given uic number and a mode.
   * @param {Number} stationId UIC of the station..
   * @param {Boolean} isSchematic If true, request schematic stations.
   */
  getStation(stationId, mode) {
    const params = {
      channel: `station${getModeSuffix(mode, modes)}`,
      args: stationId,
    };

    return new Promise((resolve, reject) => {
      this.conn.get(params, (data) => {
        if (data.content) {
          const station = this.format.readFeature(data.content);
          station.set('mode', mode);
          resolve(station);
        } else {
          reject(data.content);
        }
      });
    });
  }

  /**
   * Update the model's station list for a given mode and a bbox.
   */
  getStations(mode, bbox) {
    const stations = [];
    if (bbox) {
      this.conn.setBbox(bbox);
    }
    const params = {
      channel: `station${getModeSuffix(mode, modes)}`,
    };
    window.clearTimeout(this.stationUpdateTimeout);
    return new Promise((resolve, reject) => {
      this.conn.get(params, (data) => {
        if (data.content) {
          stations.push(this.format.readFeature(data.content));
          window.clearTimeout(this.stationUpdateTimeout);
          this.stationUpdateTimeout = window.setTimeout(() => {
            resolve(stations);
          }, 50);
        } else {
          reject(data.content);
        }
      });
    });
  }

  /**
   * Subscribe to stations channel.
   * One callback pro station.
   */
  subscribeStations(mode, bbox, callback) {
    this.unsubscribeStations();
    if (bbox) {
      this.conn.setBbox(bbox);
    }
    this.subscribe(`station${getModeSuffix(mode, modes)}`, (data) => {
      if (data.content) {
        callback(this.format.readFeature(data.content));
      }
    });
  }

  /**
   * Unsubscribe to healthcheck channel.
   */
  unsubscribeStations() {
    window.clearTimeout(this.stationUpdateTimeout);
    this.unsubscribe('stations');
  }

  /**
   * Subscribe to extra_geoms channel.
   */
  subscribeExtraGeoms(callback) {
    this.subscribe('extra_geoms', (data) => {
      const extraGeom = data.content;

      if (extraGeom) {
        const { ref } = extraGeom.properties;

        if (extraGeom.type === 'Feature') {
          const f = this.format.readFeature(extraGeom);
          this.extraGeoms[ref] = f;
        } else {
          delete this.extraGeoms[ref];
        }

        callback(this.extraGeoms);
      }
    });
  }

  /**
   * Unsubscribe to extra_geoms channel.
   */
  unsubscribeExtraGeoms() {
    this.unsubscribe('extra_geoms');
  }

  /**
   * Subscribe to trajectory channel.
   */
  subscribeTrajectory(mode, callback) {
    this.unsubscribeTrajectory();
    this.subscribe(`trajectory${getModeSuffix(mode, modes)}`, callback);
  }

  /**
   * Unsubscribe to trajectory channels.
   */
  unsubscribeTrajectory() {
    this.unsubscribe(`trajectory`);
  }

  /**
   * Subscribe to deleted_vhicles channel.
   */
  subscribeDeletedVehicles(mode, callback) {
    this.unsubscribeDeletedVehicles();
    this.subscribe(`deleted_vehicles${getModeSuffix(mode, modes)}`, callback);
  }

  /**
   * Unsubscribe to deleted_vhicles channels.
   */
  unsubscribeDeletedVehicles() {
    this.unsubscribe('deleted_vehicles');
  }

  /**
   * Get a full trajectory of a vehicule .
   * @param {Object} vehicle A vehicle object.
   * @param {String} mode Representative mode 'schematic' or 'topographic'.
   */
  getFullTrajectory(vehicle, mode, projection) {
    const { id } = vehicle;
    if (projection) {
      this.conn.setProjection(projection);
    }
    const params = {
      channel: `full_trajectory${getModeSuffix(mode, modes)}_${id}`,
    };

    return new Promise((resolve) => {
      this.conn.get(params, (data) => {
        // Reset the projection after the request is done.
        this.conn.setProjection(this.dfltProjection);
        if (data.content) {
          resolve(data.content);
        }
      });
    });
  }

  /**
   * Get full trajectories of a vehicules .
   * @param {Array<Object>} vehicles List of vehicles.
   * @param {String} mode Representative mode 'schematic' or 'topographic'.
   */
  getFullTrajectories(vehicles, mode) {
    const promises = vehicles.map((vehicle) => {
      return this.getFullTrajectory(vehicle, mode);
    });
    return Promise.all(promises);
  }

  /**
   * Subscribe to full_trajectory channel of a given vehicle.
   * @param {Object} vehicle A vehicle object.
   * @param {String} mode Representative mode 'schematic' or 'topographic'.
   */
  subscribeFullTrajectory(vehicle, mode) {
    const { id } = vehicle;
    // window.clearTimeout(this.fullTrajectoryUpdateTimeout);
    this.unsubscribeFullTrajectory(id);
    this.subscribe(
      `full_trajectory${getModeSuffix(mode, modes)}_${id}`,
      (data) => {
        // eslint-disable-next-line no-console
        console.log('subscribe full_trajectory', data);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.log('subscribe full_trajectory error', err);
      },
    );
  }

  /**
   * Unsubscribe from full_trajectory channel
   * @param {Object} vehicle A vehicle object.
   */
  unsubscribeFullTrajectory({ id }) {
    this.unsubscribe('full_trajectory', `_${id}`);
  }

  /**
   * Get a list of stations for this vehicle.
   * @param {Object} vehicle A vehicle object.
   * @param {String} mode Representative mode 'schematic' or 'topographic'.
   */
  getStopSequence(vehicle, mode) {
    const { id } = vehicle;
    const params = {
      channel: `stopsequence${getModeSuffix(mode, modes)}_${id}`,
    };
    return new Promise((resolve, reject) => {
      this.conn.get(
        params,
        (data) => {
          // Remove the delay from arrivalTime nad departureTime
          resolve(cleanStopTime(data.content && data.content[0]));
        },
        (err) => {
          reject(err);
        },
      );
    });
  }

  /**
   * Get a list of stations for some vehicles.
   * @param {Array<Object>} vehicles List of vehicles.
   * @param {String} mode Representative mode 'schematic' or 'topographic'.
   */
  getStopSequences(vehicles, mode) {
    const promises = vehicles.map((vehicle) => {
      return this.getStopSequence(vehicle, mode);
    });
    return Promise.all(promises);
  }

  /**
   * Subscribe to stopsequence channel of a given vehicle.
   * @param {Object} vehicle A vehicle object.
   * @param {String} mode Representative mode 'schematic' or 'topographic'.
   */
  subscribeStopSequence(vehicle, mode, onMessage) {
    const { id } = vehicle;
    window.clearTimeout(this.fullTrajectoryUpdateTimeout);
    this.unsubscribeStopSequence(vehicle);

    this.subscribe(
      `stopsequence${getModeSuffix(mode, modes)}_${id}`,
      (data) => {
        // Remove the delay from arrivalTime nad departureTime
        onMessage(cleanStopTime(data.content && data.content[0]));
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.log('subscribe stopsequence error', err);
      },
    );
  }

  /**
   * Unsubscribe from stopsequence channel
   * @param {Object} vehicle A vehicle object.
   */
  unsubscribeStopSequence({ id }) {
    this.unsubscribe(`stopsequence`, `_${id}`);
  }

  /**
   * Subscribe to healthcheck channel.
   */
  subscribeHealthCheck(callback) {
    this.unsubscribeHealthCheck();
    this.subscribe('healthcheck', callback);
  }

  /**
   * Unsubscribe to healthcheck channel.
   */
  unsubscribeHealthCheck() {
    this.unsubscribe('healthcheck');
  }
}
export default TralisAPI;
