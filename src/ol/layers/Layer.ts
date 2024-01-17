/* eslint-disable @typescript-eslint/no-useless-constructor */
/* eslint-disable */
import { Map } from 'ol';
import OlLayer from 'ol/layer/Layer';
import type { Options } from 'ol/layer/Layer';
import PropertiesLayerMixin from '../../common/mixins/PropertiesLayerMixin';

import type { PropertiesLayerMixinOptions } from '../../common/mixins/PropertiesLayerMixin';

export type LayerOptions = Options & PropertiesLayerMixinOptions;


/**
 * A class representing a layer to display on an OpenLayers map.
 *
 * @example
 * import { Layer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new Layer({});
 *
 * @see <a href="/example/ol-map">Map example</a>
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {ol/layer/Layer}
 * @implements {PropertiesLayerInterface}
 */
class Layer extends PropertiesLayerMixin(OlLayer) {
  options?: LayerOptions = {};

  /**
   * Constructor.
   *
   * @param {LayerCommonOptions} options
   * @param {string} [options.name=uuid()] Layer name. Default use a generated uuid.
   * @param {string} [options.key=uuid().toLowerCase()] Layer key, will use options.name.toLowerCase() if not specified.
   * @param {string} [options.copyright=undefined] Copyright-Statement.
   * @param {Array<Layer>} [options.children=[]] Sublayers.
   * @param {Object} [options.properties={}] Application-specific layer properties.
   * @param {boolean} [options.visible=true] If true this layer is the currently visible layer on the map.
   */
  constructor(options: LayerOptions = {}) {
    super(options);
  }

  setMapInternal(map: Map) {
    super.setMapInternal(map);
    if (map) {
      this.attachToMap(map);
    } else {
      this.detachFromMap();
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  attachToMap(map: Map) {
    // @ts-ignore
    if (super.attachToMap) {
      // @ts-ignore
      super.attachToMap(map);
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  detachFromMap() {
    // @ts-ignore
    if (super.detachFromMap) {
      // @ts-ignore
      super.detachFromMap();
    }
  }

  /**
   * Define layer's properties.
   *
   * @private
   */
  defineProperties() {
    // @ts-ignore
    if (super.defineProperties) {
      // @ts-ignore
      super.defineProperties();
    }

    // for backward compatibility with v2
    Object.defineProperties(this, {
      olLayer: {
        get: () => {
          // eslint-disable-next-line no-console
          console.log(
            "Deprecated property: mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This getter is only a redirect to the current 'this' object.",
          );
          return this;
        },
        set: () => {
          // eslint-disable-next-line no-console
          console.log(
            'Deprecated property: mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This setter has no effect.',
          );
        },
      },
    });
  }

  /**
   * Create a copy of the Layer.
   * @param {Object} newOptions Options to override
   * @return {Layer} A Layer
   */
  clone(newOptions: LayerOptions) {
    return new Layer({ ...this.options, ...newOptions });
  }
}
export default Layer;
