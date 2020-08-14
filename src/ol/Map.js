import OLMap from 'ol/Map';
import OLLayer from 'ol/layer/Layer';
import Layer from './layers/Layer';

/**
 * An OpenLayers map for handling mobility layer.
 *
 * @example
 * import { Map } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 *   view: new View({
 *     center: [0, 0],
 *     zoom: 1,
 *  }),
 * });
 *
 * @see <a href="/examples/ol-map">Map example</a>
 *
 * @extends {ol/Map~Map}
 */
class Map extends OLMap {
  /**
   * Constructor.
   *
   * @param {Object} options See [ol/Map~Map](https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html) options documentation.
   * @param {Array<Layer|ol/layer/Layer~Layer>} [options.layers] Array of layers.
   */
  constructor(options = {}) {
    super({
      ...options,
      layers: (options.layers || []).map((l) =>
        l instanceof OLLayer ? l : l.olLayer,
      ),
    });

    /** @ignore */
    this.mobilityLayers =
      (options.layers || []).filter((l) => l instanceof Layer) || [];
  }

  /**
   * Adds a layer to the map.
   * @param {Layer|ol/layer/Layer~Layer} layer The layer to add.
   */
  addLayer(layer) {
    if (!layer.init) {
      // layer is an OpenLayer layer
      super.addLayer(layer);
    } else {
      // layer is an mobility layer
      layer.init(this);

      if (layer.olLayer) {
        super.addLayer(layer.olLayer);
      }

      if (layer instanceof Layer) {
        this.mobilityLayers.push(layer);
      }
    }
  }

  /**
   * Returns a list of mobility layers.
   *
   * @returns {Layer[]}
   */
  getMobilityLayers() {
    return this.mobilityLayers;
  }

  /**
   * Removes a given layer from the map.
   * @param {Layer|ol/layer/Layer~Layer} layer The layer to remove.
   */
  removeLayer(layer) {
    if (!layer.terminate) {
      super.removeLayer(layer);
    } else {
      layer.terminate();
      this.mobilityLayers = this.mobilityLayers.filter((l) => l !== layer);
      if (layer.olLayer) {
        super.removeLayer(layer);
      }
    }
  }
}

export default Map;
