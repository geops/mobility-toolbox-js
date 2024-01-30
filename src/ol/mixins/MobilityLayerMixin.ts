import Layer from 'ol/layer/Layer';
import PropertiesLayerMixin, {
  PropertiesLayerMixinOptions,
} from './PropertiesLayerMixin';
import OlUserInteractionsLayerMixin from './UserInteractionsLayerMixin';
import type { UserInteractionsLayerMixinOptions } from '../../common/mixins/UserInteractionsLayerMixin';

export type LayerOptions = PropertiesLayerMixinOptions &
  UserInteractionsLayerMixinOptions;

type GConstructor<T = Layer> = new (...args: any[]) => T;
type GLayerConstructor = GConstructor<Layer>;

/**
 * @private
 */
function OlMobilityLayerMixin<TBase extends GLayerConstructor>(Base: TBase) {
  class OlMobilityLayer extends OlUserInteractionsLayerMixin(
    PropertiesLayerMixin(Base),
  ) {
    constructor(options: LayerOptions = {}) {
      super(options);
    }
  }
  return OlMobilityLayer;
}

export default OlMobilityLayerMixin;
