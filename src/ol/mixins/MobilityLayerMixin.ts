import { Layer } from 'ol/layer';
import PropertiesLayerMixin, {
  PropertiesLayerMixinOptions,
} from './PropertiesLayerMixin';

export type MobilityLayerOptions = PropertiesLayerMixinOptions & {
  [x: string]: any;
};

type GConstructor<T = {}> = new (...args: any[]) => T;
export type Layerable = GConstructor<Omit<Layer, keyof string>>;

function MobilityLayerMixin<TBase extends Layerable>(Base: TBase) {
  return class MobilityLayer extends PropertiesLayerMixin(Base) {
    // constructor(options: MobilityLayerOptions = {}) {
    //   super(options);
    // }
  };
}

export default MobilityLayerMixin;
