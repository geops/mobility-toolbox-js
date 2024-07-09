import debounce from 'lodash.debounce';
import OLLayer from 'ol/layer/Layer';
import CanvasLayerRenderer from 'ol/renderer/canvas/Layer';
import LayerRenderer from 'ol/renderer/Layer';

import MobilityLayerMixin, {
  MobilityLayerOptions,
} from '../mixins/MobilityLayerMixin';

let deprecated: (message: string) => void = () => {};
if (
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('deprecated')
) {
  deprecated = debounce((message: string) => {
    // eslint-disable-next-line no-console
    console.warn(message);
  }, 1000);
}

/**
 * An OpenLayers layer here only for backward compatibility v2.
 * @deprecated Use an OpenLayers Layer instead.
 */
class Layer extends MobilityLayerMixin(OLLayer) {
  constructor(options: MobilityLayerOptions) {
    super(options);
    deprecated('Layer is deprecated. Use an OpenLayers Layer instead.');
  }

  clone(newOptions: MobilityLayerOptions): Layer {
    return new Layer({
      ...(this.options || {}),
      ...(newOptions || {}),
    });
  }

  // ol does not like when it returns null.
  createRenderer(): LayerRenderer<OLLayer> {
    return new CanvasLayerRenderer(this);
  }
}

export default Layer;
