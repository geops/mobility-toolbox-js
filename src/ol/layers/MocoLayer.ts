import MaplibreStyleLayer from './MaplibreStyleLayer';

/**
 * An OpenLayers layer able to display data from the [geOps MOCO API](https://developer.geops.io/apis/realtime/).
 *
 * @example
 * import { MaplibreLayer, MaplibreStyleLayer } from 'mobility-toolbox-js/ol';
 *
 * const maplibreLayer = new MaplibreLayer({
 *   apiKey: 'yourApiKey',
 * });
 *
 * const layer = new MaplibreStyleLayer({
 *   maplibreLayer: maplibreLayer,
 *   layersFilter: (layer) => {
 *     // show/hide only style layers related to stations
 *     return /station/.test(layer.id);
 *   },
 * });
 *
 * @see <a href="/example/ol-maplibre-style-layer">OpenLayers MaplibreStyle layer example</a>
 * @extends {ol/layer/Layer~Layer}
 */
class MocoLayer extends MaplibreStyleLayer {}

export default MocoLayer;
