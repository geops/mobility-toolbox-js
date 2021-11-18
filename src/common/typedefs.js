/**
 * @typedef {function} FilterFunction
 * @param {Object} vehicle Vehicle to filter.
 */

/**
 * @typedef {Object} ViewState
 * @property {number} time A time in ms.
 * @property {number[2]} center A center in mercator coordinate.
 * @property {number[4]} extent An Extent in mercator coordinates.
 * @property {number[2]} size A size ([width, height]).
 * @property {number} rotation A rotation in radians.
 * @property {number} resolution A resolution.
 * @property {number} zoom A zoom level.
 * @property {number} pixelRatio A pixel ratio.
 */

/**
 * @typedef {Object} FeatureInfo
 * @property {Layer} layer A layer.
 * @property {ol/Feature~Feature[]} features  An array of features.
 * @property {number[2]} coordinate The coordinate where to find the featue.
 */
