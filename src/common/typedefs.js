/**
 * @typedef {function} FilterFunction
 * @param {Vehicle} vehicle Vehicle to filter.
 * @returns boolean
 */
/**
 * @typedef {function} SortFunction
 * @param {any} a Object a to compare.
 * @param {any} b Object b to compare.
 * @returns number
 */

/**
 * @typedef {function} getMotsByZoomFunction
 * @param {number} zoom Curent zoom level.
 * @param {RealtimeMot[][]} motsByZoom Default array of mots by zoom.
 * @returns number
 */
/**
 * @typedef {Object} ViewState
 * @property {number|undefined} time A time in ms.
 * @property {number[2]|undefined} center A center in mercator coordinate.
 * @property {number[4]} extent An Extent in mercator coordinates.
 * @property {number[2]} size A size ([width, height]).
 * @property {number} rotation A rotation in radians.
 * @property {number} resolution A resolution.
 * @property {number} zoom A zoom level.
 * @property {number|undefined} pixelRatio A pixel ratio.
 */
/**
 * @typedef {Object} FeatureInfo
 * @property {Layer} layer A layer.
 * @property {Feature[]} features  An array of features.
 * @property {number[2]} coordinate The coordinate where to find the featue.
 */
/**
 * @typedef {Object} VehiclePosition
 * @property {number[2]} coord Coordinate of the vehicle position in Mercator .
 * @property {number!} rotation  An angle in radians representing the direction (from the true north) towards which the vehicle is facing.
 */
// These lines is to block TypeScript to add "use strict;" in the outputed file.
const dummy = () => {};
export default dummy;
