/**
 * @typedef {Object} Departure
 * @property {number} time Timestamp in ms.
 * @property {boolean} no_stop_between
 * @property {number} train_number
 * @property {string[]} to
 * @property {number} ris_aimed_time Timestamp in ms.
 * @property {number} updated_at Timestamp in ms.
 * @property {boolean} new_to
 * @property {number} min_arrival_time Timestamp in ms.
 * @property {string[]} next_stoppoints List of next stops. Like value in at_station_ds100.
 * @property {number} ris_estimated_time Timestamp in ms.
 * @property {NetworkLine} line
 * @property {boolean} has_fzo if true this departure has realtime data.
 * @property {number} train_id
 * @property {string} platform
 * @property {?*} state
 * @property {number} fzo_estimated_time Timestamp in ms.
 * @property {?*} formation
 * @property {?*} no_stop_till
 * @property {number} train_type
 * @property {number} call_id
 * @property {string} created_at Timestamp in ms.
 * @property {string} at_station_ds100
 * @property {number} timediff Timestamp in ms.
 *
 */

/**
 * @typedef {GeoJSONFeature} Station
 * @property {StationProperties} properties Returns the station's properties.
 * @property {GeoJSONPoint} geometry Returns a point.
 */

/**
 * @typedef {Object} StationProperties
 * @property {Transfer[]} transfers
 * @property {boolean} elevatorOutOfOrder
 * @property {number} uic
 * @property {string} name
 * @property {NetworkLine[]} networkLines
 * @property {boolean} hasElevator
 * @property {boolean} hasZOB
 * @property {boolean} hasAccessibility
 * @property {string} type
 */

/**
 * @typedef {Object} NetworkLine
 * @property {number} id Identifier of the line.
 * @property {string} color Color of the line (CSS color string).
 * @property {string} stroke Stroke color of the line (CSS color string).
 * @property {string} name Name of the line.
 * @property {string} text_color  Text color of the line  (CSS color string).
 */

/**
 * @typedef {Object} Transfer
 * @property {string} mot Mode of transportation (ex: U-Bahn).
 * @property {string[]} lines Array of lines name (ex: ["U4", "U5"]).
 */

/**
 * @typedef {GeoJSONFeature} StopSequence
 */

/**
 * @typedef {GeoJSONFeature} RealtimeTrajectory
 */

/**
 * @typedef {GeoJSONFeature} FullTrajectory
 */

/**
 * @typedef {GeoJSONFeature} Vehicle
 */

/**
 * @typedef {GeoJSONFeature} ExtraGeom
 */
