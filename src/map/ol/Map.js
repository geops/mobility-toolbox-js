import OLMap from 'ol/Map';
import OLLayer from 'ol/layer/Layer';
import Layer from '../../layers/ol/Layer';

/**
 * An OpenLayers for handling {@link Layer|Layers}.
 * This class extends the OpenLayers class
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html|ol/Map}.
 *
 * [mtb-js-example: map-example]
 *
 * @class
 * @param {Object} options Map options.
 * @param {Array.Layer} [options.layers] List of {@link Layer|Layers}.
 */
class Map extends OLMap {
  constructor(options = {}) {
    super({
      ...options,
      layers: (options.layers || []).map((l) =>
        l instanceof OLLayer ? l : l.olLayer,
      ),
    });

    this.mobilityLayers =
      (options.layers || []).filter((l) => l instanceof Layer) || [];
    this.mobilityLayers.forEach((l) => l.setMap(this));
  }

  /**
   * Adds a {@link Layer} to the map.
   * @param {Layer} The {@link Layer} to add.
   */
  addLayer(layer) {
    if (layer.olLayer) {
      super.addLayer(layer.olLayer);
    }
    layer.setMap(this);
    this.mobilityLayers.push(layer);
  }

  /**
   * Returns a list of layers.
   * @returns {Layer} {@link Layer}.
   */
  getLayers() {
    return this.mobilityLayers;
  }

  /**
   * Removes a given layer from the map.
   * @param {Layer} The {@link Layer} to remove.
   * @returns The removed layer (or undefined if the layer was not found).
   */
  removeLayer(layer) {
    this.mobilityLayers = this.mobilityLayers.filter((l) => l !== layer);
    layer.terminate();
    return super.removeLayer(layer);
  }
}

export default Map;
