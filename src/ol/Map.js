import OLMap from 'ol/Map';
import { defaults as defaultControls } from 'ol/control';
import Control from '../common/controls/Control';
import Layer from './layers/Layer';
import mixin from '../common/mixins/MapMixin';
import CopyrightControl from './controls/Copyright';

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
class Map extends mixin(OLMap) {
  /**
   * Constructor.
   *
   * @param {Object} options See [ol/Map~Map](https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html) options documentation.
   * @param {Array<Layer|ol/layer/Layer~Layer>} [options.layers] Array of layers.
   */
  constructor(options = {}) {
    super({
      ...options,
      layers: [],
      controls: [],
    });

    // Add controls
    (
      options.controls || [
        ...defaultControls({ attribution: false }).getArray(),
        new CopyrightControl(),
      ]
    ).forEach((control) => {
      this.addControl(control);
    });

    // Add layers
    (options.layers || []).forEach((layer) => {
      this.addLayer(layer);
    });
  }

  /**
   * Get the HTML element containing the map.
   *
   * @return {HTMLElement} The HTML element of the container.
   */
  getContainer() {
    return this.getTargetElement();
  }

  /**
   * Adds a layer to the map.
   * @param {Layer|ol/layer/Layer~Layer} layer The layer to add.
   */
  addLayer(layer) {
    if (layer instanceof Layer) {
      // layer is an mobility layer
      layer.init(this);
      this.mobilityLayers.push(layer);

      if (layer.olLayer) {
        super.addLayer(layer.olLayer);
      }

      this.dispatchEvent({
        type: 'change:mobilityLayers',
        target: this,
      });
    } else {
      // layer is an OpenLayer layer
      super.addLayer(layer);
    }
  }

  /**
   * Removes a given layer from the map.
   * @param {Layer|ol/layer/Layer~Layer} layer The layer to remove.
   */
  removeLayer(layer) {
    if (layer instanceof Layer) {
      layer.terminate();
      this.mobilityLayers = this.mobilityLayers.filter((l) => l !== layer);
      if (layer.olLayer) {
        super.removeLayer(layer);
      }
    } else {
      // layer is an OpenLayer layer
      super.removeLayer(layer);
    }
  }

  /**
   * Adds a given control to the map.
   * @param {Control|ol/control/Control~Control} control The control to add.
   */
  addControl(control) {
    if (control instanceof Control) {
      this.addMobilityControl(control);
    } else {
      super.addControl(control);
    }
  }

  /**
   * Removes a given control to the map.
   * @param {Control|ol/control/Control~Control} control The control to remove.
   */
  removeControl(control) {
    if (control instanceof Control) {
      this.removeMobilityControl(control);
    } else {
      // control is an OpenLayer control
      super.removeControl(control);
    }
  }
}

export default Map;
