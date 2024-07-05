import { Layer } from 'ol/layer';

import PropertiesLayerMixin, {
  PropertiesLayerMixinOptions,
} from './PropertiesLayerMixin';

export type MobilityLayerOptions = PropertiesLayerMixinOptions &
  Record<string, any>;

type GConstructor<T = object> = new (...args: any[]) => T;
export type Layerable = GConstructor<Omit<Layer, keyof string>>;

function MobilityLayerMixin<TBase extends Layerable>(Base: TBase) {
  return class MobilityLayer extends PropertiesLayerMixin(Base) {
    // constructor(options: MobilityLayerOptions = {}) {
    //   super(options);
    // }
  };
}

export default MobilityLayerMixin;
