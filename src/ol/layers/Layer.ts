import OLLayer from 'ol/layer/Layer';
import MobilityLayerMixin, {
  MobilityLayerOptions,
} from '../mixins/MobilityLayerMixin';

/**
 * An OpenLayers layer here only for backward compatibility v2.
 * @deprecated
 */
class Layer extends MobilityLayerMixin(OLLayer) {
  constructor(options: MobilityLayerOptions) {
    super(options);
    // eslint-disable-next-line no-console
    console.warn('Layer is deprecated. Use an OpenLayers Layer instead.');
  }

  clone(newOptions: MobilityLayerOptions): Layer {
    return new Layer({
      ...(this.options || {}),
      ...(newOptions || {}),
    });
  }
}

export default Layer;
