import debounce from 'lodash.debounce';
import OLLayer from 'ol/layer/Layer';
import LayerRenderer from 'ol/renderer/Layer';

import defineDeprecatedProperties from '../utils/defineDeprecatedProperties';

import type { Map } from 'ol';
import type { Options } from 'ol/layer/Layer';

export type MobilityLayerOptions = {
  children?: any[];
  copyrights?: string[];
  disabled?: boolean;
  group?: string;
  hitTolerance?: number;
  key?: string;
  map?: Map;
  name?: string;
} & Options &
  Record<string, unknown>;

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

class EmptyLayerRenderer extends LayerRenderer<OLLayer> {
  prepareFrame() {
    return true;
  }

  renderFrame() {
    // Return an empty div as a placeholder HTMLElement
    return document.createElement('div');
  }
}

/**
 * An OpenLayers layer here only for backward compatibility v2.
 * @deprecated Use an OpenLayers Layer instead.
 */
class Layer extends OLLayer {
  constructor(options: MobilityLayerOptions = {}) {
    super(options);
    defineDeprecatedProperties(this, options);
    deprecated('Layer is deprecated. Use an OpenLayers Layer instead.');
  }

  clone(newOptions: MobilityLayerOptions): Layer {
    return new Layer({
      ...(this.get('options') || {}),
      ...(newOptions || {}),
    });
  }

  // ol does not like when it returns null.
  createRenderer(): LayerRenderer<OLLayer> {
    return new EmptyLayerRenderer(this);
  }
}

export default Layer;
