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
 * @typedef {ol/Map~Map|mapboxgl.Map|maplibregl.Map} AnyMap
 */
/**
 * @typedef {Object} MaplibreLayerOptions
 * @property {string} apiKey Access key for [geOps apis](https://developer.geops.io/).
 * @property {string} apiKeyName geOps Maps api key name.
 * @property {maplibregl.MapOptions} options.mapOptions Maplibre map options.
 * @property {string} style geOps Maps api style.
 * @property {string} url geOps Maps api url.
 */
/**
 * @typedef {Object} ControlCommonOptions
 * @property {boolean} [active = true] Whether the control is active or not.
 * @property {HTMLElement} element The HTML element used to render the control.
 * @property {HTMLElement} target The HTML element where to render the element property. Default is the map's element.
 * @property {function} render Render function called whenever the control needs to be rerendered.
 */
/**
 * @typedef {Object} LayerCommonOptions
 * @property {string!} key Identifier of the layer. Must be unique.
 * @property {string!} name  Name of the layer.
 * @property {string!} group Group of the layer.
 * @property {string[]!} copyrights List of copyrights.
 * @property {Layer[]!} children List of children layers.
 * @property {boolean!} visible  Define if the layer is currently display on the map.
 * @property {boolean!} disabled Define if the layer is currently display on the map but can't be seen (extent, zoom ,data restrictions).
 * @property {number!} hittolerance Hit-detection tolerance in css pixels. Pixels inside the radius around the given position will be checked for features.
 * @property {Object!} properties - Custom properties.
 * @property {AnyMap!} map - The map used to display the layer.
 */
/**
 * @typedef {Object} VehiclePosition
 * @property {number[2]} coord Coordinate of the vehicle position in Mercator .
 * @property {number!} rotation  An angle in radians representing the direction (from the true north) towards which the vehicle is facing.
 */
// These lines is to block TypeScript to add "use strict;" in the outputed file.
const dummy = () => {};
export default dummy;
