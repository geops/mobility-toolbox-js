import Layer from 'ol/layer/Layer';
import PropertiesLayerMixin, {
  PropertiesLayerMixinOptions,
} from './PropertiesLayerMixin';

export type MobilityLayerOptions = PropertiesLayerMixinOptions & {
  [x: string]: any;
};

function MobilityLayerMixin(Base: typeof Layer) {
  return class extends PropertiesLayerMixin(Base) {
    constructor(options: MobilityLayerOptions = {}) {
      super(options);
    }
  };
}

export default MobilityLayerMixin;
