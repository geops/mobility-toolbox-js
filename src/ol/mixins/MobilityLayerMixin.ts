import Layer from 'ol/layer/Layer';
import PropertiesLayerMixin, {
  PropertiesLayerMixinOptions,
} from './PropertiesLayerMixin';
import type { UserInteractionsLayerMixinOptions } from '../../common/mixins/UserInteractionsLayerMixin';
import UserInteractionsLayerMixin from './UserInteractionsLayerMixin';

export type MobilityLayerOptions = PropertiesLayerMixinOptions &
  UserInteractionsLayerMixinOptions;

type GConstructor<T = Layer> = new (...args: any[]) => T;
type GLayerConstructor = GConstructor<Layer>;

/**
 * @private
 */
function MobilityLayerMixin<TBase extends GLayerConstructor>(Base: TBase) {
  // @ts-ignore
  class MobilityLayer extends UserInteractionsLayerMixin(
    PropertiesLayerMixin(Base),
  ) {
    constructor(options: MobilityLayerOptions = {}) {
      super(options);
    }
  }
  return MobilityLayer;
}

export default MobilityLayerMixin;
