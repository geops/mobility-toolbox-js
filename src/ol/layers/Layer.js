import { unByKey } from 'ol/Observable';
import CommonLayer from '../../common/layers/Layer';

/**
 * A class representing a layer to display on an OpenLayers map.
 *
 * @param {Object} options
 * @param {ol/Layer} options.olLayer The {@link https://openlayers.org/en/latest/apidoc/module-ol_layer_Layer-Layer.html ol/Layer} (required).
 * @param {string} [options.name=uuid()] Layer name. Default use a generated uuid.
 * @param {string} [options.key=uuid().toLowerCase()] Layer key, will use options.name.toLowerCase() if not specified.
 * @param {string} [options.copyright=undefined] Copyright-Statement.
 * @param {Array<Layer>} [options.children=[]] Sublayers.
 * @param {Object} [options.properties={}] Application-specific layer properties.
 * @param {boolean} [options.visible=true] If true this layer is the currently visible layer on the map.
 * @param {boolean} [options.isBaseLayer=false] If true this layer is a baseLayer.
 * @param {boolean} [options.isQueryable=false] If true feature information can be queried by the react-spatial LayerService. Default is undefined, but resulting to true if not strictly set to false.
 * @extends CommonLayer
 */
export default class Layer extends CommonLayer {
  constructor(options) {
    super(options);
    if (this.olLayer) {
      this.olLayer.setVisible(this.visible);
    }
  }

  defineProperties(options) {
    super.defineProperties(options);
    Object.defineProperties(this, {
      olLayer: { value: options.olLayer, writable: true },
      olListenersKeys: {
        value: [],
      },
    });
  }

  /**
   * @param {Map} map A OpenLayers [Map](https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html).
   * @private
   */
  init(map) {
    super.init(map);
  }

  /**
   * Unlisten potential listeners.
   * @private
   */
  terminate() {
    unByKey(this.olListenersKeys);
    super.terminate();
  }

  /**
   * Change the visibility of the layer
   *
   * @param {boolean} visible Defines the visibility of the layer
   * @param {boolean} [stopPropagationDown]
   * @param {boolean} [stopPropagationUp]
   * @param {boolean} [stopPropagationSiblings]
   */
  setVisible(
    visible,
    stopPropagationDown = false,
    stopPropagationUp = false,
    stopPropagationSiblings = false,
  ) {
    if (visible === this.visible) {
      return;
    }
    if (this.olLayer) {
      this.olLayer.setVisible(this.visible);
    }

    super.setVisible(
      visible,
      stopPropagationDown,
      stopPropagationUp,
      stopPropagationSiblings,
    );
  }
}
