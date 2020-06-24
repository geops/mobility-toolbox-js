/**
 * @typedef {Object} OperatingInformations
 * @property {string} operatingPeriod
 * @property {string} notOperatingDays
 * @property {string} additionalOperatingDays
 *
 */

/**
 * @typedef {Object} Trajectory
 * @property {string} id
 * @property {string} type
 * @property {string} name
 * @property {string} color
 * @property {string} textColor
 * @property {string} delay
 * @property {string} operator
 * @property {string} journeyIdentifier
 * @property {string} routeIdentifier
 * @property {string} timeIntervals
 * @property {ol/geom/LineString~LineString} geometry  A LineString in [EPSG:4326](http://epsg.io/4326).
 * @property {string} cancelled
 */

/**
 * @typedef {Object} TrajStation
 * @property {string} id
 * @property {string} destination
 * @property {string} backgroundColor
 * @property {string} color
 * @property {string} vehicleType
 * @property {string} routeIdentifier
 * @property {string} longName
 * @property {string} shortName
 * @property {string} stations
 * @property {string} wheelchairAccessible
 * @property {string} bicyclesAllowed
 * @property {string} realTime
 * @property {string} feedsId
 * @property {OperatingInformations} operatingInformations:,
 * @property {string} operator
 * @property {string} operatorUrl
 * @property {string} operatorTimeZone
 */
