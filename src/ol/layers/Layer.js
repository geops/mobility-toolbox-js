import { unByKey } from 'ol/Observable';
import Group from 'ol/layer/Group';
import LayerCommon from '../../common/layers/Layer';

/**
 * A class representing a layer to display on an OpenLayers map.
 *
 * @example
 * import { Layer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new Layer({
 *   olLayer: ...,
 * });
 *
 * @see <a href="/example/ol-map">Map example</a>
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
class Layer extends LayerCommon {
  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {ol/layer/Layer~Layer} options.olLayer The layer (required).
   * @param {string} [options.name=uuid()] Layer name. Default use a generated uuid.
   * @param {string} [options.key=uuid().toLowerCase()] Layer key, will use options.name.toLowerCase() if not specified.
   * @param {string} [options.copyright=undefined] Copyright-Statement.
   * @param {Array<Layer>} [options.children=[]] Sublayers.
   * @param {Object} [options.properties={}] Application-specific layer properties.
   * @param {boolean} [options.visible=true] If true this layer is the currently visible layer on the map.
   * @param {boolean} [options.isBaseLayer=false] If true this layer is a baseLayer.
   * @param {boolean} [options.isQueryable=true] If true feature information can be queried by the react-spatial LayerService. Default is true.
   */
  constructor(options) {
    super(options);

    if (this.olLayer) {
      this.olLayer.setVisible(this.visible);
    }
  }

  /**
   * Define layer's properties.
   *
   * @ignore
   */
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
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  init(map) {
    super.init(map);

    if (!this.map || !this.olLayer) {
      return;
    }

    this.olListenersKeys.push(
      this.map.getLayers().on('remove', (evt) => {
        if (evt.element === this.olLayer) {
          this.terminate();
        }
      }),
    );

    // We set the copyright to the source used by the layer.
    if (this.copyrights) {
      const attributions = this.copyrights || [];
      if (this.olLayer instanceof Group) {
        this.olLayer
          .getLayers()
          .getArray()
          .forEach((layer) => {
            layer.getSource().setAttributions(attributions);
          });
      } else {
        this.olLayer.getSource().setAttributions(attributions);
      }
    }
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
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

    super.setVisible(
      visible,
      stopPropagationDown,
      stopPropagationUp,
      stopPropagationSiblings,
    );

    if (this.olLayer) {
      this.olLayer.setVisible(this.visible);
    }
  }

  /**
   * Create a copy of the Layer.
   * @param {Object} newOptions Options to override
   * @returns {Layer} A Layer
   */
  clone(newOptions) {
    return new Layer({ ...this.options, ...newOptions });
  }
}
export default Layer;
